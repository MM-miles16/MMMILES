import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyToken } from "@/lib/auth";
import jwt from "jsonwebtoken";

export const dynamic = "force-dynamic";

// Supabase client using service role key to bypass RLS during callback updates
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// "DL1420110012345" → "DL14XXXXXXX2345" (only first 4 and last 4 are kept)
function maskLicence(value: string | null): string | null {
  if (!value || value === "DIGILOCKER_VERIFIED") return null;
  const v = value.replace(/\s+/g, "");
  return v.length <= 8 ? v : `${v.slice(0, 4)}${"X".repeat(v.length - 8)}${v.slice(-4)}`;
}

// Last 4 digits of the Aadhaar number, for the read-only "XXXX XXXX 1234" on the renter's
// Documents page. Read from DigiLocker's e-Aadhaar XML, whose uid is masked, e.g. "xxxxxxxx1234".
// Only these 4 digits are kept; the rest of the document is discarded at once. Best effort: if
// the request fails (or this DigiLocker app isn't allowed to read e-Aadhaar), the card shows
// "Verified" without the digits.
async function aadhaarLast4(accessToken: string): Promise<string | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 6000);
  try {
    const res = await fetch("https://digilocker.meripehchaan.gov.in/public/oauth2/3/xml/eaadhaar", {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
    const xml = await res.text();
    const uid = xml.match(/\buid\s*=\s*"([^"]+)"/i)?.[1] || xml.match(/<uid>([^<]+)<\/uid>/i)?.[1] || "";
    return uid.trim().match(/(\d{4})$/)?.[1] || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function removeAadhaarAndTokens(value: any): any {
  if (Array.isArray(value)) return value.map(removeAadhaarAndTokens);
  if (typeof value === "string") {
    return value.replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, "[REDACTED]");
  }
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !/(aadhaar|eaadhaar|id_token|access_token|refresh_token)/i.test(key))
      .map(([key, item]) => [key, removeAadhaarAndTokens(item)])
  );
}

export async function GET(request: Request) {
  let frontendVerifyUrl = "/host-registration-form/verify-profile";
  
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const state = requestUrl.searchParams.get("state");
    const errorParam = requestUrl.searchParams.get("error");
    const errorDescription = requestUrl.searchParams.get("error_description");

    const protocol = requestUrl.protocol;
    const host = requestUrl.host;
    // Renters (dashboard Documents) or hosts (registration form): set by /api/auth/digilocker
    const forRenter = /(?:^|;\s*)digilocker_purpose=renter/.test(request.headers.get("cookie") || "");
    frontendVerifyUrl = forRenter
      ? `${protocol}//${host}/dashboard?tab=documents`
      : `${protocol}//${host}/host-registration-form/verify-profile`;

    // 1. Check for authorization errors from DigiLocker
    if (errorParam || errorDescription) {
      console.error("DigiLocker authorization error:", errorParam, errorDescription);
      return NextResponse.redirect(
        `${frontendVerifyUrl}${frontendVerifyUrl.includes("?") ? "&" : "?"}status=failed&error=${encodeURIComponent(errorDescription || "Verification declined by user")}`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(`${frontendVerifyUrl}${frontendVerifyUrl.includes("?") ? "&" : "?"}status=failed&error=Missing code or state`);
    }

    // 2. CSRF and PKCE Validation
    const cookieHeader = request.headers.get("cookie") || "";
    const stateMatch = cookieHeader.match(/digilocker_oauth_state=([^;]+)/);
    const savedState = stateMatch ? stateMatch[1] : null;

    const codeVerifierMatch = cookieHeader.match(/digilocker_code_verifier=([^;]+)/);
    const savedCodeVerifier = codeVerifierMatch ? codeVerifierMatch[1] : null;

    if (!savedState || savedState !== state) {
      console.error("CSRF state token mismatch or expired");
      return NextResponse.redirect(`${frontendVerifyUrl}${frontendVerifyUrl.includes("?") ? "&" : "?"}status=failed&error=Invalid request session`);
    }

    if (!savedCodeVerifier) {
      console.error("Missing PKCE code verifier");
      return NextResponse.redirect(`${frontendVerifyUrl}${frontendVerifyUrl.includes("?") ? "&" : "?"}status=failed&error=Invalid PKCE session`);
    }

    // 3. User Authentication: Identify the logged-in user
    const authMatch = cookieHeader.match(/auth_token=([^;]+)/);
    const authToken = authMatch ? authMatch[1] : null;
    const decodedUser = authToken ? verifyToken(authToken) : null;

    if (!decodedUser || !decodedUser.sub) {
      console.error("Unauthorized callback: No active user session token found");
      return NextResponse.redirect(`${frontendVerifyUrl}${frontendVerifyUrl.includes("?") ? "&" : "?"}status=failed&error=Session expired. Please log in again.`);
    }

    const userId = decodedUser.sub;
    const userPhone = decodedUser.phone_number;

    // 4. Token Exchange Request (Authorization Code -> Access Token)
    // We target the OIDC token endpoint /oauth2/2/token
    const tokenUrl = "https://digilocker.meripehchaan.gov.in/public/oauth2/2/token";
    const clientId = process.env.DIGILOCKER_CLIENT_ID;
    const clientSecret = process.env.DIGILOCKER_CLIENT_SECRET;
    const redirectUri = process.env.DIGILOCKER_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      console.error("DigiLocker config variables missing on server");
      return NextResponse.redirect(`${frontendVerifyUrl}${frontendVerifyUrl.includes("?") ? "&" : "?"}status=failed&error=DigiLocker auth misconfigured`);
    }

    const tokenParams = new URLSearchParams({
      code,
      grant_type: "authorization_code",
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code_verifier: savedCodeVerifier,
    });

    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: tokenParams.toString(),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Token exchange failed with response:", errorText);
      return NextResponse.redirect(`${frontendVerifyUrl}${frontendVerifyUrl.includes("?") ? "&" : "?"}status=failed&error=Token exchange failed`);
    }

    const tokenData = await tokenResponse.json();
    const { access_token, id_token, digilockerid, name: responseName, dob: responseDob, gender: responseGender } = tokenData;

    if (!access_token) {
      console.error("No access token in token exchange response");
      return NextResponse.redirect(`${frontendVerifyUrl}${frontendVerifyUrl.includes("?") ? "&" : "?"}status=failed&error=Empty access token returned`);
    }

    // 5. Decode the id_token to extract verified identity, PAN and DL claims.
    let verifiedName = responseName || null;
    let verifiedDob = responseDob || null;
    let verifiedGender = responseGender || null;
    let verifiedPan = null;
    let verifiedDl = null;
    let verifiedSsoId = digilockerid || null;
    // Keep diagnostic data without credentials or Aadhaar fields. The original
    // provider response is useful for support, but identity data must not be
    // retained simply for debugging.
    let rawPayload: any = removeAadhaarAndTokens({ tokenData });

    if (id_token) {
      try {
        const decodedIdToken: any = jwt.decode(id_token);
        if (decodedIdToken) {
          rawPayload = { ...rawPayload, idTokenClaims: removeAadhaarAndTokens(decodedIdToken) };
          
          // Map standard OpenID claims
          verifiedName = decodedIdToken.name || decodedIdToken.given_name || verifiedName;
          verifiedDob = decodedIdToken.birthdate || decodedIdToken.dob || verifiedDob;
          verifiedGender = decodedIdToken.gender || verifiedGender;
          verifiedPan = decodedIdToken.pan_number || decodedIdToken.pan || null;
          verifiedDl = decodedIdToken.driving_licence || decodedIdToken.driving_license || null;
          verifiedSsoId = decodedIdToken.user_sso_id || decodedIdToken.sub || verifiedSsoId;
        }
      } catch (jwtErr) {
        console.error("Error decoding id_token JWT:", jwtErr);
      }
    }

    // A document must actually be supplied by DigiLocker. The scope is an
    // authoritative issuer reference, so it is accepted only when it contains
    // the PAN/DL issuer URI; we never manufacture a verified document value.
    const scopeStr = tokenData?.scope || "";
    if (!verifiedPan) {
      const panMatch = scopeStr.match(/issued\/in\.gov\.pan-PANCR(?:-([A-Z0-9]+))?/i);
      if (panMatch) verifiedPan = panMatch[1] || "DIGILOCKER_VERIFIED";
    }
    if (!verifiedDl) {
      const dlMatch = scopeStr.match(/issued\/in\.gov\.transport-DRVLC(?:-([A-Z0-9]+))?/i);
      if (dlMatch) verifiedDl = dlMatch[1] || "DIGILOCKER_VERIFIED";
    }

    // 6. Fallback: Fetch user details via /oauth2/1/user endpoint if basic data is missing
    if (!verifiedName || !verifiedDob) {
      try {
        const userProfileUrl = "https://digilocker.meripehchaan.gov.in/public/oauth2/1/user";
        const profileResponse = await fetch(userProfileUrl, {
          headers: { Authorization: `Bearer ${access_token}` },
        });
        if (profileResponse.ok) {
          const profile = await profileResponse.json();
          rawPayload = { ...rawPayload, userProfile: removeAadhaarAndTokens(profile) };
          verifiedName = profile.name || verifiedName;
          verifiedDob = profile.dob || verifiedDob;
          verifiedGender = profile.gender || verifiedGender;
          verifiedSsoId = profile.digilockerid || verifiedSsoId;
        }
      } catch (profileErr: any) {
        console.error("Profile fallback fetch error:", profileErr.message);
      }
    }

    // Renters: keep only what the dashboard shows — licence verified (masked number) and Aadhaar
    // verified (DigiLocker's eaadhaar flag or the issued Aadhaar document scope) with its last 4
    // digits. The full Aadhaar number is never stored.
    if (forRenter) {
      const licenceVerified = typeof verifiedDl === "string" && verifiedDl.length > 0;
      const aadhaarVerified = String(tokenData?.eaadhaar || "").toUpperCase() === "Y" || /uidai-ADHAR/i.test(scopeStr);
      if (!licenceVerified && !aadhaarVerified) {
        return NextResponse.redirect(
          `${frontendVerifyUrl}&status=failed&error=${encodeURIComponent("DigiLocker didn't share your driving licence or Aadhaar. Please allow access and try again.")}`
        );
      }
      const now = new Date().toISOString();
      const last4 = aadhaarVerified ? await aadhaarLast4(access_token) : null;
      const { error: kycError } = await supabase.from("customer_kyc").upsert(
        {
          user_id: userId,
          dl_verified: licenceVerified,
          dl_number_masked: maskLicence(verifiedDl),
          aadhaar_verified: aadhaarVerified,
          ...(last4 ? { aadhaar_last4: last4 } : {}), // keep earlier digits if this read failed
          name_on_record: verifiedName,
          verified_at: now,
          updated_at: now,
        },
        { onConflict: "user_id" }
      );
      if (kycError) {
        console.error("Failed to save renter verification:", kycError.message);
        return NextResponse.redirect(`${frontendVerifyUrl}&status=failed&error=${encodeURIComponent("We couldn't save your verification. Please try again.")}`);
      }
      const done = NextResponse.redirect(`${frontendVerifyUrl}&status=success`);
      done.cookies.delete("digilocker_oauth_state");
      done.cookies.delete("digilocker_code_verifier");
      done.cookies.delete("digilocker_purpose");
      return done;
    }

    const hasPan = typeof verifiedPan === "string" && verifiedPan.length > 0;
    const hasDl = typeof verifiedDl === "string" && verifiedDl.length > 0;
    if (!verifiedName || (!hasPan && !hasDl)) {
      return NextResponse.redirect(
        `${frontendVerifyUrl}${frontendVerifyUrl.includes("?") ? "&" : "?"}status=failed&error=${encodeURIComponent("DigiLocker must provide your verified identity name and at least one of PAN or Driving Licence.")}`
      );
    }

    // 7. Persist only a completed, eligible KYC record. The applicant name is
    // retained separately from the government-record name.
    const { error: dbError } = await supabase
      .from("host_kyc_verifications")
      .upsert({
        phone: userPhone,
        aadhaar_name: verifiedName,
        masked_aadhaar: null,
        pan_number: verifiedPan,
        driving_licence: verifiedDl,
        dob: verifiedDob,
        gender: verifiedGender,
        digilocker_id: verifiedSsoId,
        raw_payload: rawPayload
      }, { onConflict: "phone" });

    if (dbError) {
      console.error("Failed to save KYC status to database:", dbError);
      return NextResponse.redirect(`${frontendVerifyUrl}${frontendVerifyUrl.includes("?") ? "&" : "?"}status=failed&error=Database persistence error`);
    }

    // Redirect the browser back to verify-profile page with status=success
    const response = NextResponse.redirect(`${frontendVerifyUrl}${frontendVerifyUrl.includes("?") ? "&" : "?"}status=success`);
    
    // Clear temporary CSRF state and PKCE cookies
    response.cookies.delete("digilocker_oauth_state");
    response.cookies.delete("digilocker_code_verifier");
    response.cookies.delete("digilocker_purpose");
    return response;

  } catch (error: any) {
    console.error("DigiLocker callback endpoint exception:", error);
    return NextResponse.redirect(
      `${frontendVerifyUrl}${frontendVerifyUrl.includes("?") ? "&" : "?"}status=failed&error=${encodeURIComponent(error.message || "Unknown callback error")}`
    );
  }
}
