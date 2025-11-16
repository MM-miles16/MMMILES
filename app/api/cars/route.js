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
    if (brand) query = query.eq("make", brand);
    if (priceMin) query = query.gte("hourly_rate", parseFloat(priceMin));
    if (priceMax) query = query.lte("hourly_rate", parseFloat(priceMax));
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

    // If pickup and return times are provided, filter out vehicles with overlapping bookings
    let availableVehicles = vehiclesData;
    
    if (pickupTimeRaw && returnTimeRaw) {
      try {
        // Parse date from DD/MM/YYYY HH:MM format to ISO timestamp
        const parseDate = (dateString) => {
          if (!dateString) return null;
          
          // Handle URL encoded format: "17%2F11%2F2025+09%3A00" -> "17/11/2025 09:00"
          const decoded = decodeURIComponent(dateString);
          
          // Replace + with space and parse DD/MM/YYYY HH:MM format
          const cleanDate = decoded.replace(/\+/g, ' ');
          
          // Parse DD/MM/YYYY HH:MM format
          const match = cleanDate.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/);
          if (!match) {
            console.warn("❌ Date format not recognized:", dateString, "-> decoded:", decoded, "-> clean:", cleanDate);
            return null;
          }
          
          const [, day, month, year, hour, minute] = match;
          // Create ISO string: YYYY-MM-DDTHH:MM:00Z
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour}:${minute}:00+00:00`;
        };

        const pickupTimeISO = parseDate(pickupTimeRaw);
        const returnTimeISO = parseDate(returnTimeRaw);

        if (!pickupTimeISO || !returnTimeISO) {
          console.error("❌ Failed to parse dates:", { pickupTimeRaw, returnTimeRaw });
          return Response.json([], { status: 200 }); // Return empty array instead of error
        }

        console.log("📅 Searching for bookings between:", {
          pickup: pickupTimeISO,
          return: returnTimeISO
        });

        // 🔍 COMPREHENSIVE BOOKING CHECK - Try multiple approaches
        
        // Approach 1: Check for bookings with common status values
        const statusOptions = [
          ["confirmed", "pending"], 
          ["booked"], 
          ["active"], 
          ["confirmed"],
          ["pending"]
        ];

        let overlappingBookings = [];
        let bookingError = null;

        for (const statuses of statusOptions) {
          console.log(`🔍 Trying status values: [${statuses.join(", ")}]`);
          
          const { data, error } = await supabase
            .from("bookings")
            .select("vehicle_id, status, start_time, end_time")
            .in("status", statuses)
            .lt("start_time", returnTimeISO)  // booking starts before requested return
            .gt("end_time", pickupTimeISO);   // booking ends after requested pickup

          if (error) {
            console.log(`❌ Error with status [${statuses.join(", ")}]:`, error.message);
            bookingError = error;
            continue;
          }

          console.log(`✅ Found ${data?.length || 0} bookings with status [${statuses.join(", ")}]`);
          
          if (data && data.length > 0) {
            overlappingBookings = data;
            console.log("📋 Sample bookings:", data.slice(0, 3));
            break; // Success, no need to try other status options
          }
        }

        // Approach 2: If no bookings found, check if any bookings exist at all
        if (overlappingBookings.length === 0) {
          console.log("🔍 No overlapping bookings found. Checking if any bookings exist...");
          
          const { data: allBookings, error: allBookingsError } = await supabase
            .from("bookings")
            .select("vehicle_id, status, start_time, end_time")
            .limit(5);

          if (allBookingsError) {
            console.error("❌ Cannot access bookings table at all:", allBookingsError);
            console.log("💡 This suggests RLS policies or connection issues");
          } else {
            console.log(`📊 Total bookings in database: ${allBookings?.length || 0}`);
            if (allBookings && allBookings.length > 0) {
              const statusCounts = allBookings.reduce((acc, booking) => {
                acc[booking.status] = (acc[booking.status] || 0) + 1;
                return acc;
              }, {});
              console.log("📈 Status distribution:", statusCounts);
              
              // Try with actual status values from database
              const actualStatuses = Object.keys(statusCounts);
              console.log(`🔍 Retrying with actual status values: [${actualStatuses.join(", ")}]`);
              
              const { data: retryBookings, error: retryError } = await supabase
                .from("bookings")
                .select("vehicle_id, status, start_time, end_time")
                .in("status", actualStatuses)
                .lt("start_time", returnTimeISO)
                .gt("end_time", pickupTimeISO);

              if (!retryError && retryBookings && retryBookings.length > 0) {
                overlappingBookings = retryBookings;
                console.log("✅ Success with actual status values!");
              }
            } else {
              console.log("⚠️ No bookings found in database at all!");
            }
          }
        }

        // If we still can't access bookings due to errors, proceed with all vehicles
        if (overlappingBookings.length === 0 && bookingError) {
          console.log("⚠️ Unable to check bookings due to database access issues");
          console.log("💡 Returning all vehicles (booking check failed)");
          return new Response(JSON.stringify(availableVehicles || []), {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "s-maxage=30, stale-while-revalidate=60",
            },
          });
        }

        console.log(`🎯 Final overlapping bookings count: ${overlappingBookings.length}`);

        // Create a Set of booked vehicle IDs for faster lookup
        const bookedVehicleIds = new Set(
          overlappingBookings.map((booking) => booking.vehicle_id)
        );

        console.log("🚫 Booked vehicle IDs:", Array.from(bookedVehicleIds));

        // Filter out vehicles that have overlapping bookings
        availableVehicles = vehiclesData.filter(
          (vehicle) => !bookedVehicleIds.has(vehicle.id)
        );

        console.log(`✅ Available vehicles after filtering: ${availableVehicles.length}/${vehiclesData.length}`);

      } catch (dateError) {
        console.error("💥 Date parsing error:", dateError);
        return Response.json(vehiclesData, { status: 200 }); // Return all vehicles if date parsing fails
      }
    }

    console.log("🎉 Returning vehicles:", availableVehicles.length);

    return new Response(JSON.stringify(availableVehicles || []), {
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