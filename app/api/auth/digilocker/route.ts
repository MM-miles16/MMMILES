import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { getUserFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

function base64URLEncode(buffer: Buffer) {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

export async function GET(request: Request) {
  try {
    const user = getUserFromRequest(request);
    if (!user?.phone_number) {
      return NextResponse.redirect(new URL("/login?redirect=/host-registration-form", request.url));
    }
    // Prevent direct links from starting an OAuth session without the required
    // Aadhaar entry and applicant name collected by the application.
    const { data: preparation } = await supabase
      .from("host_kyc_verifications")
      .select("declared_name, masked_aadhaar")
      .eq("phone", user.phone_number)
      .maybeSingle();
    if (!preparation?.declared_name || !preparation?.masked_aadhaar) {
      return NextResponse.redirect(new URL("/host-registration-form/verify-profile?status=failed&error=Enter%20your%20Aadhaar%20number%20before%20continuing", request.url));
    }
    const clientId = process.env.DIGILOCKER_CLIENT_ID;
    const redirectUri = process.env.DIGILOCKER_REDIRECT_URI;

    if (!clientId || !redirectUri) {
      console.error("DigiLocker environment variables missing in environment configurations");
      return NextResponse.json(
        { error: "DigiLocker auth is currently misconfigured." },
        { status: 500 }
      );
    }

    // Generate secure CSRF state token to prevent CSRF attacks
    const state = crypto.randomBytes(16).toString("hex");

    // PKCE: Generate code_verifier and code_challenge
    const codeVerifier = base64URLEncode(crypto.randomBytes(32));
    const codeChallenge = base64URLEncode(
      crypto.createHash("sha256").update(codeVerifier).digest()
    );

    // Construct DigiLocker authorize URL
    const authUrl = new URL("https://api.digitallocker.gov.in/public/oauth2/1/authorize");
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("code_challenge", codeChallenge);
    authUrl.searchParams.set("code_challenge_method", "S256");

    const response = NextResponse.redirect(authUrl.toString());

    // Store state in a secure, HttpOnly cookie to validate upon callback redirection
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 300, // 5 minutes validity
      sameSite: "lax" as const,
    };

    response.cookies.set("digilocker_oauth_state", state, cookieOptions);
    response.cookies.set("digilocker_code_verifier", codeVerifier, cookieOptions);

    return response;
  } catch (error) {
    console.error("Failed to initiate DigiLocker Auth:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
