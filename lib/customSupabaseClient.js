import { createClient } from "@supabase/supabase-js";

// Standard Supabase client for non-auth-dependent operations
export const supabaseCustom = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  }
);

// Helper function to make authenticated requests to Supabase REST API
export async function makeAuthenticatedRequest(method, table, options = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  if (!token) {
    throw new Error("No authentication token found");
  }

  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  const url = `${baseUrl}/rest/v1/${table}`;

  try {
    const response = await fetch(url, {
      method: method || "GET",
      headers: {
        "apikey": apiKey,
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
      body: options.body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Supabase API error (${response.status}):`, errorText);
      throw new Error(`Request failed: ${response.status} ${errorText}`);
    }

    // Check content type and handle different response types
    const contentType = response.headers.get("content-type");
    
    // For DELETE operations, return null
    if (method === "DELETE") {
      return null;
    }

    // If no content or empty response
    if (!contentType || !contentType.includes("application/json")) {
      return null;
    }

    const text = await response.text();
    if (!text.trim()) {
      return null; // Return null for empty responses
    }

    return JSON.parse(text);
    
  } catch (error) {
    console.error("Request failed:", error);
    throw error;
  }
}