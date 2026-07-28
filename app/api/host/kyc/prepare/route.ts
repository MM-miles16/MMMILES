import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getUserFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(request: Request) {
  const user = getUserFromRequest(request);
  if (!user?.sub || !user.phone_number) {
    return NextResponse.json({ error: "Please sign in before verifying your identity." }, { status: 401 });
  }

  try {
    const { declaredName } = await request.json();
    const name = String(declaredName || "").trim();

    if (name.length < 2 || name.length > 120) {
      return NextResponse.json({ error: "Enter the name you want displayed as a host." }, { status: 400 });
    }

    // DigiLocker is the source of truth for identity documents. We do not ask
    // for or persist Aadhaar numbers in this application.
    const { error } = await supabase
      .from("host_kyc_verifications")
      .upsert({
        phone: user.phone_number,
        declared_name: name,
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
