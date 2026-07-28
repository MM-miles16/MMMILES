import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getUserFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY! // service role to modify hosts
);

const isDigiLockerDocument = (value: unknown) =>
  typeof value === "string" &&
  value.length > 0 &&
  value !== "VERIFIED_PAN" &&
  value !== "VERIFIED_DL";

export async function POST(request: Request) {
  try {
    // 1. Authenticate user
    const user = getUserFromRequest(request);
    if (!user || !user.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.sub;
    const userPhone = user.phone_number;

    if (!userPhone) {
      return NextResponse.json({ error: "Authenticated user phone number is missing." }, { status: 400 });
    }

    // 2. Parse request payload
    const body = await request.json();
    const { fullName, email, address } = body;

    if (!fullName || !email) {
      return NextResponse.json({ error: "Full Name and Email are required." }, { status: 400 });
    }

    // 3. Double-check if this user has indeed completed KYC verification (prevent bypass)
    const { data: kycData, error: kycError } = await supabase
      .from("host_kyc_verifications")
      .select("id, declared_name, aadhaar_name, pan_number, driving_licence")
      .eq("phone", userPhone)
      .maybeSingle();

    if (kycError) {
      console.error("KYC verification lookup error:", kycError);
      return NextResponse.json({ error: "Failed to verify KYC status" }, { status: 500 });
    }

    if (!kycData || (!isDigiLockerDocument(kycData.pan_number) && !isDigiLockerDocument(kycData.driving_licence))) {
      // Force user to verify profile before submitting registration
      return NextResponse.json({ 
        error: "KYC verification is incomplete. Please complete DigiLocker verification first." 
      }, { status: 403 });
    }

    // The display name is the applicant-provided name, not the DigiLocker name.
    // This is intentionally a server-side decision so the confirmation form
    // cannot substitute a different name after KYC.
    if (fullName.trim() !== kycData.declared_name?.trim()) {
      return NextResponse.json({ error: "Your host name changed. Please restart verification to update it." }, { status: 400 });
    }

    // 4. Check if host record already exists for this phone number
    const { data: existingHost, error: hostCheckError } = await supabase
      .from("hosts")
      .select("id")
      .eq("phone", userPhone)
      .maybeSingle();

    if (hostCheckError) {
      console.error("Host check error:", hostCheckError);
      return NextResponse.json({ error: "Database error checking host record" }, { status: 500 });
    }

    let resultId;

    if (existingHost) {
      // Update existing host profile
      const { error: updateError } = await supabase
        .from("hosts")
        .update({
          full_name: fullName,
          email: email,
          verified: true
        })
        .eq("id", existingHost.id);

      if (updateError) {
        console.error("Failed to update host:", updateError);
        return NextResponse.json({ error: "Database error updating host profile" }, { status: 500 });
      }
      resultId = existingHost.id;
    } else {
      // Insert new host profile
      // Note: hosts table id is bigint. Supabase will auto-generate it if it's set up as identity,
      // or we can select max(id)+1 if needed.
      // Let's check: normally primary key id is set as autoincrementing. We insert without ID.
      const { data: newHost, error: insertError } = await supabase
        .from("hosts")
        .insert({
          full_name: fullName,
          phone: userPhone,
          email: email,
          verified: true
        })
        .select("id")
        .single();

      if (insertError) {
        console.error("Failed to insert new host:", insertError);
        return NextResponse.json({ error: "Database error inserting host profile" }, { status: 500 });
      }
      resultId = newHost.id;
    }

    // 5. Also upsert to customers profile table to keep user profiles aligned
    const { data: existingCustomer } = await supabase
      .from("customers")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    const customerPayload = {
      user_id: userId,
      first_name: fullName.split(" ")[0] || fullName,
      last_name: fullName.split(" ").slice(1).join(" ") || "",
      phone: userPhone,
      email: email,
      address: address
    };

    if (existingCustomer) {
      await supabase
        .from("customers")
        .update(customerPayload)
        .eq("id", existingCustomer.id);
    } else {
      await supabase
        .from("customers")
        .insert(customerPayload);
    }

    // 6. Update verification flag on users table
    await supabase
      .from("users")
      .update({ verified: true })
      .eq("id", userId);

    return NextResponse.json({
      success: true,
      message: "Host registration completed successfully.",
      hostId: resultId
    });

  } catch (err: any) {
    console.error("Host registration exception:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
