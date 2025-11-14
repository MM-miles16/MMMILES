import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      storageKey: "supabase.auth.token",
      autoRefreshToken: false, // Disable auto-refresh for custom JWT
      detectSessionInUrl: false,
    },
  }
);

export { supabase };
