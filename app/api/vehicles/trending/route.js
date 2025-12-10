import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * GET /api/vehicles/trending
 * Fetches trending vehicles filtered by city
 * Query params: city (required)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city");

    // Validate required city parameter
    if (!city) {
      return NextResponse.json(
        { error: "City parameter is required" },
        { status: 400 }
      );
    }

    // Build query: Filter by city and trending=true, order by created_at desc
    const url = new URL(`${SUPABASE_URL}/rest/v1/vehicles`);
    url.searchParams.set("city", `eq.${city}`);
    url.searchParams.set("trending", "eq.true");
    url.searchParams.set("select", "*,vehicle_images(*)");
    url.searchParams.set("order", "created_at.desc");
    url.searchParams.set("limit", "10"); // Limit to 10 trending cars

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to fetch trending vehicles" },
        { status: response.status }
      );
    }

    const vehicles = await response.json();

    // Return vehicles (empty array if none found)
    return NextResponse.json({
      success: true,
      city,
      count: vehicles.length,
      vehicles,
    });
  } catch (error) {
    console.error("Error fetching trending vehicles:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
