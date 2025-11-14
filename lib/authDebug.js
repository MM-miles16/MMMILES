// Debug function to verify JWT and auth.uid() compatibility
export function debugAuth() {
  if (typeof window === "undefined") return;

  try {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      console.log("❌ No auth token found");
      return;
    }

    // Parse JWT payload
    const parts = token.split(".");
    if (parts.length !== 3) {
      console.log("❌ Invalid JWT format");
      return;
    }

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/").padEnd(
      base64Url.length + (4 - base64Url.length % 4) % 4,
      "="
    );
    const payload = JSON.parse(atob(base64));

    console.log("🔍 JWT Payload Debug:");
    console.log("  - sub (user ID):", payload.sub);
    console.log("  - role:", payload.role);
    console.log("  - aud:", payload.aud);
    console.log("  - exp:", new Date(payload.exp * 1000).toISOString());

    if (payload.sub && payload.role === "authenticated" && payload.aud === "authenticated") {
      console.log("✅ JWT structure looks correct for RLS");
    } else {
      console.log("❌ JWT structure issue - check payload format");
    }

  } catch (error) {
    console.error("Debug error:", error);
  }
}