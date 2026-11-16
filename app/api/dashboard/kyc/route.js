// GET /api/dashboard/kyc — the signed-in renter's DigiLocker verification, shown read-only
// (driving licence: verified + masked number; Aadhaar: verified + "XXXX XXXX 1234" when DigiLocker
// shared it)
import { NextResponse } from "next/server";
import { currentUser, db, failed, notSetUp, setUpLater, unauthorized } from "@/lib/dashboardServer";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const user = currentUser(request);
  if (!user) return unauthorized();

  const available = Boolean(process.env.DIGILOCKER_CLIENT_ID && process.env.DIGILOCKER_REDIRECT_URI);
  const { data, error } = await db()
    .from("customer_kyc")
    .select("dl_verified, dl_number_masked, aadhaar_verified, aadhaar_last4, name_on_record, verified_at")
    .eq("user_id", user.sub)
    .maybeSingle();
  if (notSetUp(error)) return setUpLater({ available });
  if (error) {
    console.error("kyc read failed:", error.message);
    return failed();
  }

  return NextResponse.json({
    available,
    licence: { verified: Boolean(data?.dl_verified), number: data?.dl_number_masked || null },
    aadhaar: { verified: Boolean(data?.aadhaar_verified), number: data?.aadhaar_verified && data?.aadhaar_last4 ? `XXXX XXXX ${data.aadhaar_last4}` : null },
    name: data?.name_on_record || null,
    verifiedAt: data?.verified_at || null,
  });
}
