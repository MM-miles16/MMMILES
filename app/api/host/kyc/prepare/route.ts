import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getUserFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const maskAadhaar = (value: string) => `XXXX XXXX ${value.slice(-4)}`;

export async function POST(request: Request) {
  const user = getUserFromRequest(request);
  if (!user?.sub || !user.phone_number) {
    return NextResponse.json({ error: "Please sign in before verifying your identity." }, { status: 401 });
  }

  try {
    const { aadhaarNumber, declaredName } = await request.json();
    const aadhaar = String(aadhaarNumber || "").replace(/\s|-/g, "");
    const name = String(declaredName || "").trim();

    if (!/^\d{12}$/.test(aadhaar)) {
      return NextResponse.json({ error: "Enter a valid 12-digit Aadhaar number." }, { status: 400 });
    }
    if (name.length < 2 || name.length > 120) {
      return NextResponse.json({ error: "Enter the name you want displayed as a host." }, { status: 400 });
    }

    // Aadhaar numbers are sensitive identity data. Persist only the masked value;
    // DigiLocker remains the source of truth for the identity itself.
    const { error } = await supabase
      .from("host_kyc_verifications")
      .upsert({
        phone: user.phone_number,
        declared_name: name,
        masked_aadhaar: maskAadhaar(aadhaar),
      }, { onConflict: "phone" });

    if (error) {
      console.error("Unable to save host KYC preparation:", error);
      return NextResponse.json({ error: "Could not save your verification details. Please try again." }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid verification request." }, { status: 400 });
  }
}
