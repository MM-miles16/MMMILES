import { supabase } from "../../../lib/supabaseClient.js";
import { canonicalCity } from "../../../lib/cities.js";
import { asShowcase, isShowcaseCity, SHOWCASE_IDS } from "../../../lib/showcase.js";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    // "Bangalore" in a link → "Bengaluru", the spelling in the vehicles table
    const city = canonicalCity(searchParams.get("city"));
    if (!city)
      return Response.json({ error: "City missing" }, { status: 400 });

    // optional filters
    const type = searchParams.get("type");
    const fuel = searchParams.get("fuel");
    const transmission = searchParams.get("transmission");
    const seats = searchParams.get("seats");
    const year = searchParams.get("year");
    const brand = searchParams.get("brand");
    const priceMin = searchParams.get("priceMin");
    const priceMax = searchParams.get("priceMax");
    const gps = searchParams.get("gps");
    const ac = searchParams.get("ac");

    // time filters for availability check
    const pickupTimeRaw = searchParams.get("pickupTime");
    const returnTimeRaw = searchParams.get("returnTime");

    console.log("🔍 API Call Details:", {
      city,
      type,
      fuel,
      transmission,
      seats,
      year,
      brand,
      priceMin,
      priceMax,
      gps,
      ac,
      pickupTimeRaw,
      returnTimeRaw
    });

    // Bengaluru preview: while no Bengaluru car is live, show the preview cars from lib/showcase
    // (filtered like the real list; they can't be booked — see the car page)
    if (isShowcaseCity(city)) {
      const { count, error: countError } = await supabase
        .from("vehicles")
        .select("id", { count: "exact", head: true })
        .eq("city", city)
        .eq("available_status", true);
      if (!countError && !count) {
        const { data: preview, error: previewError } = await supabase
          .from("vehicles")
          .select("*,vehicle_images(*),buffer_hours")
          .in("id", SHOWCASE_IDS);
        if (previewError) return Response.json({ error: previewError.message }, { status: 500 });
        const matches = (v) =>
          (!type || v.vehicle_type === type) &&
          (!fuel || v.fuel_type === fuel) &&
          (!transmission || v.transmission_type === transmission) &&
          (!seats || v.seating_capacity === parseInt(seats)) &&
          (!year || v.model_year === parseInt(year)) &&
          (!brand || v.make === brand) &&
          (!priceMin || v.base_daily_rate >= parseFloat(priceMin) * 24) &&
          (!priceMax || v.base_daily_rate <= parseFloat(priceMax) * 24) &&
          (gps !== "true" || v.has_gps) &&
          (ac !== "true" || v.has_ac);
        const cars = SHOWCASE_IDS.map((id) => (preview || []).find((v) => v.id === id))
          .filter(Boolean)
          .map(asShowcase)
          .filter(matches);
        return Response.json(cars, { headers: { "Cache-Control": "s-maxage=30, stale-while-revalidate=60" } });
      }
    }

    // start building query
    let query = supabase
      .from("vehicles")
      .select("*,vehicle_images(*),buffer_hours")
      .eq("city", city)
      .eq("available_status", true);

    // conditionally add filters only if they exist
    if (type) query = query.eq("vehicle_type", type);
    if (fuel) query = query.eq("fuel_type", fuel);
    if (transmission) query = query.eq("transmission_type", transmission);
    if (seats) query = query.eq("seating_capacity", parseInt(seats));
    if (year) query = query.eq("model_year", parseInt(year));
    if (brand) query = query.eq("make", brand);
    if (priceMin) query = query.gte("base_daily_rate", parseFloat(priceMin) * 24);
    if (priceMax) query = query.lte("base_daily_rate", parseFloat(priceMax) * 24);
    if (gps === "true") query = query.eq("has_gps", true);
    if (ac === "true") query = query.eq("has_ac", true);

    const { data: vehiclesData, error: vehiclesError } = await query;

    if (vehiclesError) {
      console.error("❌ Error fetching vehicles:", vehiclesError);
      return Response.json({ error: vehiclesError.message }, { status: 500 });
    }

    if (!vehiclesData) {
      console.log("⚠️ No vehicles found for city:", city);
      return Response.json([], { status: 200 });
    }

    console.log("🚗 Found vehicles:", vehiclesData.length);

    // If pickup and return times are provided, use the scalable RPC
    let availableVehicles = [];

    if (pickupTimeRaw && returnTimeRaw) {
      try {
        // Parse date from DD/MM/YYYY HH:MM format to ISO timestamp
        const parseDate = (dateString) => {
          if (!dateString) return null;
          const decoded = decodeURIComponent(dateString);
          const cleanDate = decoded.replace(/\+/g, ' ');
          const match = cleanDate.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/);
          if (!match) {
            console.warn("❌ Date format not recognized:", dateString);
            return null;
          }
          const [, day, month, year, hour, minute] = match;
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour}:${minute}:00+00:00`;
        };

        const pickupTimeISO = parseDate(pickupTimeRaw);
        const returnTimeISO = parseDate(returnTimeRaw);

        if (!pickupTimeISO || !returnTimeISO) {
          console.error("❌ Failed to parse dates for RPC:", { pickupTimeRaw, returnTimeRaw });
          return Response.json([], { status: 200 });
        }

        console.log("⚡ Fetching available vehicles via RPC:", { city, pickupTimeISO, returnTimeISO });

        let rpcQuery = supabase
          .rpc('get_available_vehicles', {
            city_param: city,
            pickup_time: pickupTimeISO,
            return_time: returnTimeISO
          })
          .select('*,vehicle_images(*),buffer_hours'); // Get related data too

        // Apply filters to RPC result
        if (type) rpcQuery = rpcQuery.eq("vehicle_type", type);
        if (fuel) rpcQuery = rpcQuery.eq("fuel_type", fuel);
        if (transmission) rpcQuery = rpcQuery.eq("transmission_type", transmission);
        if (seats) rpcQuery = rpcQuery.eq("seating_capacity", parseInt(seats));
        if (year) rpcQuery = rpcQuery.eq("model_year", parseInt(year));
        if (brand) rpcQuery = rpcQuery.eq("make", brand);
        if (priceMin) rpcQuery = rpcQuery.gte("base_daily_rate", parseFloat(priceMin) * 24);
        if (priceMax) rpcQuery = rpcQuery.lte("base_daily_rate", parseFloat(priceMax) * 24);
        if (gps === "true") rpcQuery = rpcQuery.eq("has_gps", true);
        if (ac === "true") rpcQuery = rpcQuery.eq("has_ac", true);

        const { data: rpcData, error: rpcError } = await rpcQuery;

        if (rpcError) {
          console.error("❌ RPC Error:", rpcError);
          // Fallback or error handling
          throw rpcError;
        }
        
        availableVehicles = rpcData || [];
        console.log(`⚡ RPC returned ${availableVehicles.length} vehicles.`);

      } catch (err) {
        console.error("💥 Error in RPC flow:", err);
        return Response.json({ error: "Availability check failed" }, { status: 500 });
      }

    } else {
      // No dates provided: Just return the statically filtered list from above
      availableVehicles = vehiclesData;
    }

    return new Response(JSON.stringify(availableVehicles), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "s-maxage=30, stale-while-revalidate=60",
      },
    });

  } catch (err) {
    console.error("💥 Server error in /api/cars:", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}