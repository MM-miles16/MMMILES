import { NextResponse } from "next/server";
import { canonicalCity } from "@/lib/cities";
import { asShowcase, isShowcaseCity, SHOWCASE_IDS } from "@/lib/showcase";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Public bucket — images load straight from Supabase instead of through /api/sb
const IMAGE_BASE = `${SUPABASE_URL}/storage/v1/object/public/car-images/`;

/**
 * GET /api/vehicles/fleet
 * All live (bookable) vehicles in a city for the homepage fleet section,
 * trending first. Returns only the fields the section needs.
 * Query params: city (required)
 * Bengaluru with no live cars yet returns the preview cars from lib/showcase (showcase: true).
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const city = canonicalCity(searchParams.get("city")); // Bangalore → Bengaluru

    if (!city || city.length > 40) {
      return NextResponse.json({ error: "City parameter is required" }, { status: 400 });
    }

    const SELECT =
      "id,make,model,city,vehicle_type,fuel_type,transmission_type,seating_capacity,base_daily_rate,trending,vehicle_images(image_url,is_primary)";
    const query = async (filters) => {
      const url = new URL(`${SUPABASE_URL}/rest/v1/vehicles`);
      for (const [k, v] of Object.entries(filters)) url.searchParams.set(k, v);
      url.searchParams.set("select", SELECT);
      const res = await fetch(url.toString(), {
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
      });
      if (!res.ok) throw Object.assign(new Error(await res.text()), { status: res.status });
      return res.json();
    };

    let rows;
    try {
      rows = await query({ city: `eq.${city}`, available_status: "eq.true", order: "trending.desc,created_at.desc" });
      // Bengaluru preview: no live Bengaluru cars yet → show the preview cars, in their set order
      if (rows.length === 0 && isShowcaseCity(city)) {
        const preview = await query({ id: `in.(${SHOWCASE_IDS.join(",")})` });
        rows = SHOWCASE_IDS.map((id) => preview.find((r) => r.id === id))
          .filter(Boolean)
          .map(asShowcase);
      }
    } catch (err) {
      console.error("Supabase error:", err.message);
      return NextResponse.json({ error: "Failed to fetch vehicles" }, { status: err.status || 500 });
    }

    const vehicles = rows.map((v) => {
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
        showcase: Boolean(v.showcase),
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
