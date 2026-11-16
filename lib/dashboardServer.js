// Server-only helpers for the /api/dashboard/* routes: the signed-in user (verified login token),
// a service-role Supabase client (every query is filtered to that user), and detection of tables
// or columns that don't exist yet — the dashboard shows a "being set up" state until
// supabase/migrations/20261116_customer_dashboard.sql is applied.
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getUserFromRequest } from "./auth";

let client = null;
export function db() {
  if (!client) {
    client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return client;
}

export function currentUser(request) {
  const user = getUserFromRequest(request);
  return user?.sub ? user : null;
}

export const unauthorized = () => NextResponse.json({ error: "Please log in again." }, { status: 401 });
export const setUpLater = (extra = {}) => NextResponse.json({ setup: true, ...extra });
export const failed = (message = "Something went wrong. Please try again.", status = 500) =>
  NextResponse.json({ error: message }, { status });

// Postgres / PostgREST codes for a missing table or column
export function notSetUp(error) {
  if (!error) return false;
  return ["42P01", "42703", "PGRST205", "PGRST204"].includes(error.code) || /does not exist|could not find the/i.test(error.message || "");
}

// Car photo for a vehicle row with vehicle_images (same rule as the bookings API)
const STORAGE_BASE_URL = "/api/sb/storage/v1/object/public/car-images/";
export function coverImage(vehicle) {
  const images = [...(vehicle?.vehicle_images || [])].sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0));
  const path = images[0]?.image_url;
  if (!path) return null;
  return path.startsWith("http") ? path : `${STORAGE_BASE_URL}${path}`;
}
