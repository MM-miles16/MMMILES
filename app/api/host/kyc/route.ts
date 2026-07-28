import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getUserFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY! // Bypass RLS for internal fetch
);

const isDigiLockerDocument = (value: unknown) =>
  typeof value === "string" &&
  value.length > 0 &&
  value !== "VERIFIED_PAN" &&
  value !== "VERIFIED_DL";

export async function GET(request: Request) {
  try {
    // SECURITY: Authenticate user session
    const user = getUserFromRequest(request);
    if (!user || !user.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userPhone = user.phone_number;

    if (!userPhone) {
      return NextResponse.json({ error: "Phone number missing in session" }, { status: 400 });
    }

    // Retrieve verified KYC record
    const { data: kycData, error } = await supabase
      .from("host_kyc_verifications")
      .select("*")
      .eq("phone", userPhone)
      .single();

    if (error) {
      if (error.code === "PGRST116") { // Not found
        return NextResponse.json({ verified: false }, { status: 200 });
      }
      console.error("Database error retrieving KYC status:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    const { data: host } = await supabase
      .from("hosts")
      .select("id, verified")
      .eq("phone", userPhone)
      .maybeSingle();

    const documentsEligible = isDigiLockerDocument(kycData.pan_number) || isDigiLockerDocument(kycData.driving_licence);
    return NextResponse.json({
      verified: documentsEligible,
      hostRegistered: Boolean(host?.verified),
      kyc: {
        aadhaar_name: kycData.aadhaar_name,
        declared_name: kycData.declared_name,
        masked_aadhaar: kycData.masked_aadhaar,
        pan_number: kycData.pan_number,
        driving_licence: kycData.driving_licence,
        dob: kycData.dob,
        gender: kycData.gender,
        digilocker_id: kycData.digilocker_id,
        verified_at: kycData.verified_at,
      }
    });

  } catch (error) {
    console.error("Exception in GET host KYC endpoint:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
