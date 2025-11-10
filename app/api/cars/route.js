import { supabase } from "../../../lib/supabaseClient";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get("city");
    if (!city)
      return Response.json({ error: "City missing" }, { status: 400 });

    // optional filters
    const type = searchParams.get("type");
    const fuel = searchParams.get("fuel");
    const transmission = searchParams.get("transmission");
    const seats = searchParams.get("seats");
    const year = searchParams.get("year");

    // start building query
    let query = supabase
      .from("vehicles")
      .select("*")
      .eq("city", city)
      .eq("available_status", true);

    // conditionally add filters only if they exist
    if (type) query = query.eq("vehicle_type", type);
    if (fuel) query = query.eq("fuel_type", fuel);
    if (transmission) query = query.eq("transmission_type", transmission);
    if (seats) query = query.eq("seating_capacity", parseInt(seats));
    if (year) query = query.eq("model_year", parseInt(year));

    const { data, error } = await query;

    if (error)
      return Response.json({ error: error.message }, { status: 500 });

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "s-maxage=30, stale-while-revalidate=60",
      },
    });
  } catch (err) {
    console.error("Server error in /api/cars:", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
