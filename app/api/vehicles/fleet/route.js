import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Public bucket — images load straight from Supabase instead of through /api/sb
const IMAGE_BASE = `${SUPABASE_URL}/storage/v1/object/public/car-images/`;

/**
 * GET /api/vehicles/fleet
 * All live (bookable) vehicles in a city for the homepage fleet section,
 * trending first. Returns only the fields the section needs.
 * Query params: city (required)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city");

    if (!city || city.length > 40) {
      return NextResponse.json({ error: "City parameter is required" }, { status: 400 });
    }

    const url = new URL(`${SUPABASE_URL}/rest/v1/vehicles`);
    url.searchParams.set("city", `eq.${city}`);
    url.searchParams.set("available_status", "eq.true");
    url.searchParams.set(
      "select",
      "id,make,model,vehicle_type,fuel_type,transmission_type,seating_capacity,base_daily_rate,trending,vehicle_images(image_url,is_primary)"
    );
    url.searchParams.set("order", "trending.desc,created_at.desc");

    const response = await fetch(url.toString(), {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });

    if (!response.ok) {
      console.error("Supabase error:", await response.text());
      return NextResponse.json({ error: "Failed to fetch vehicles" }, { status: response.status });
    }

    const vehicles = (await response.json()).map((v) => {
      const images = v.vehicle_images || [];
      const primary = images.find((img) => img.is_primary) || images[0];
      const path = primary?.image_url;
      return {
        id: v.id,
        name: `${v.make} ${v.model}`,
        type: v.vehicle_type || "Car",
        fuel: v.fuel_type,
        transmission: v.transmission_type,
        seats: v.seating_capacity,
        pricePerDay: v.base_daily_rate,
        trending: Boolean(v.trending),
        image: path ? (path.startsWith("http") ? path : `${IMAGE_BASE}${path}`) : null,
      };
    });

    return NextResponse.json(
      { success: true, city, count: vehicles.length, vehicles },
      // Fleet changes rarely — let the CDN serve it for 5 minutes
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
    );
  } catch (error) {
    console.error("Error fetching fleet:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
