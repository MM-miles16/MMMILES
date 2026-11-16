// /api/dashboard/reviews
// GET  — completed trips still waiting for a review, and the reviews the user has written
// POST — { bookingId, rating 1–5, comment? } review (or update the review of) one completed trip
import { NextResponse } from "next/server";
import { coverImage, currentUser, db, failed, notSetUp, setUpLater, unauthorized } from "@/lib/dashboardServer";

export const dynamic = "force-dynamic";

const TRIP_FIELDS = "id, vehicle_id, start_time, end_time, booking_code, vehicles(make, model, vehicle_images(image_url, is_primary))";

// Paid trips that have ended (only these can be reviewed)
function completedTrips(userId) {
  return db()
    .from("bookings")
    .select(TRIP_FIELDS)
    .eq("user_id", userId)
    .in("status", ["confirmed", "completed"])
    .lt("end_time", new Date().toISOString())
    .order("end_time", { ascending: false });
}

const tripView = (b) => ({
  bookingId: String(b.id),
  vehicleId: b.vehicle_id,
  title: `${b.vehicles?.make || ""} ${b.vehicles?.model || ""}`.trim() || "Your car",
  img: coverImage(b.vehicles),
  bookingCode: b.booking_code || `#${b.id}`,
  startTime: b.start_time,
  endTime: b.end_time,
});

export async function GET(request) {
  const user = currentUser(request);
  if (!user) return unauthorized();

  const reviews = await db()
    .from("car_reviews")
    .select("id, booking_id, vehicle_id, rating, comment, created_at, updated_at")
    .eq("user_id", user.sub)
    .order("created_at", { ascending: false });
  if (notSetUp(reviews.error)) return setUpLater();
  if (reviews.error) return failed();

  const trips = await completedTrips(user.sub);
  if (trips.error) return failed();

  const byBooking = new Map(trips.data.map((b) => [String(b.id), tripView(b)]));
  const reviewed = new Set(reviews.data.map((r) => r.booking_id));

  return NextResponse.json({
    pending: trips.data.filter((b) => !reviewed.has(String(b.id))).map(tripView),
    reviews: reviews.data.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment || "",
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      ...(byBooking.get(r.booking_id) || { bookingId: r.booking_id, vehicleId: r.vehicle_id, title: "Your car", img: null }),
    })),
  });
}

export async function POST(request) {
  const user = currentUser(request);
  if (!user) return unauthorized();

  let body;
  try {
    body = await request.json();
  } catch {
    return failed("Invalid request.", 400);
  }
  const rating = Number(body?.rating);
  const comment = String(body?.comment || "").trim().slice(0, 1000);
  const bookingId = String(body?.bookingId || "");
  if (!bookingId || !Number.isInteger(rating) || rating < 1 || rating > 5) return failed("Please choose a rating from 1 to 5 stars.", 400);

  // The trip must be this user's, paid and finished
  const trips = await completedTrips(user.sub);
  if (trips.error) return failed();
  const trip = trips.data.find((b) => String(b.id) === bookingId);
  if (!trip) return failed("You can review a car after your trip ends.", 400);

  const saved = await db()
    .from("car_reviews")
    .upsert(
      { user_id: user.sub, booking_id: bookingId, vehicle_id: trip.vehicle_id, rating, comment: comment || null, updated_at: new Date().toISOString() },
      { onConflict: "booking_id" }
    )
    .select("id, rating, comment, created_at, updated_at")
    .single();
  if (notSetUp(saved.error)) return setUpLater();
  if (saved.error) {
    console.error("review save failed:", saved.error.message);
    return failed();
  }
  return NextResponse.json({ ok: true, review: { ...tripView(trip), id: saved.data.id, rating: saved.data.rating, comment: saved.data.comment || "", createdAt: saved.data.created_at, updatedAt: saved.data.updated_at } });
}
