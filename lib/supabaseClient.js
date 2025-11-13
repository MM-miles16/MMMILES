import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      storageKey: "supabase.auth.token",
    },
  }
);

// Attach our custom JWT coming from OTP login
if (typeof window !== "undefined") {
  const token = localStorage.getItem("auth_token");
  if (token) {
    supabase.auth.setSession({ access_token: token, refresh_token: "" });
  }
}

export { supabase };
