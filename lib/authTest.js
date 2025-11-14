// Debug function to test JWT authentication
export async function testAuth() {
  try {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      console.log("❌ No auth token found");
      return false;
    }

    // Parse JWT to check structure
    const parts = token.split(".");
    const payload = JSON.parse(atob(parts[1]));
    
    console.log("🔍 Auth Test:");
    console.log("  - Token exists: ✅");
    console.log("  - sub (user ID):", payload.sub);
    console.log("  - role:", payload.role);
    console.log("  - aud:", payload.aud);
    console.log("  - exp:", new Date(payload.exp * 1000).toISOString());

    if (!payload.sub || payload.role !== "authenticated" || payload.aud !== "authenticated") {
      console.log("❌ Invalid JWT structure");
      return false;
    }

    // Test a simple database request
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const response = await fetch(`${baseUrl}/rest/v1/customers?user_id=eq.${payload.sub}&select=id&limit=1`, {
      headers: {
        "apikey": process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    console.log("  - Test request status:", response.status);
    
    if (response.status === 200 || response.status === 404) {
      console.log("✅ Authentication working correctly!");
      return true;
    } else {
      const errorText = await response.text();
      console.log("❌ Auth test failed:", errorText);
      return false;
    }

  } catch (error) {
    console.error("❌ Auth test error:", error);
    return false;
  }
}