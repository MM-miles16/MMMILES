// GET /api/dashboard/coupons
//   perk   — the automatic offer on the next booking (lib/offers.js)
//   offers — public offers (coupons.show_in_dashboard) the user can still use
//   mine   — personal coupons (referral rewards) assigned to the user and not yet used
//   used   — coupons applied on the user's past bookings
import { NextResponse } from "next/server";
import { currentUser, db, failed, notSetUp, unauthorized } from "@/lib/dashboardServer";
import { WELCOME_OFF } from "@/lib/offers";
import { settleReferrals } from "@/lib/referrals";

export const dynamic = "force-dynamic";

const view = (c) => ({
  code: c.code,
  description: c.description || "",
  type: c.discount_type === "percentage" ? "percentage" : "flat",
  value: Number(c.discount_value) || 0,
  maxDiscount: c.max_discount !== null && c.max_discount !== undefined ? Number(c.max_discount) : null,
  minAmount: Number(c.min_amount) || 0,
  validUntil: c.valid_until || null,
  personal: Boolean(c.assigned_user_id),
});

export async function GET(request) {
  const user = currentUser(request);
  if (!user) return unauthorized();
  const client = db();

  // Coupons already used on this account's bookings
  const past = await client
    .from("bookings")
    .select("id, booking_code, applied_coupon, created_at, status")
    .eq("user_id", user.sub)
    .not("applied_coupon", "is", null)
    .order("created_at", { ascending: false });
  if (past.error) return failed();
  const paid = past.data.filter((b) => ["confirmed", "completed"].includes(b.status));
  const spent = past.data.filter((b) => b.status !== "pending"); // paid bookings, including later cancellations

  // Show used coupons as full cards: their value and description from the coupons table
  const codes = [...new Set(spent.map((b) => b.applied_coupon))];
  const details = codes.length ? await client.from("coupons").select("code, description, discount_type, discount_value, max_discount").in("code", codes) : { data: [] };
  const byCode = new Map((details.data || []).map((c) => [String(c.code).toUpperCase(), c]));
  const used = spent.map((b) => {
    const c = byCode.get(String(b.applied_coupon).toUpperCase());
    return {
      code: b.applied_coupon,
      bookingCode: b.booking_code || `#${b.id}`,
      date: b.created_at,
      type: c ? (c.discount_type === "percentage" ? "percentage" : "flat") : null,
      value: c ? Number(c.discount_value) || 0 : null,
      maxDiscount: c?.max_discount !== null && c?.max_discount !== undefined ? Number(c.max_discount) : null,
      description: c?.description || "",
      personal: /^MMREF/i.test(b.applied_coupon),
    };
  });
  const usedCodes = new Set(paid.map((b) => String(b.applied_coupon).toUpperCase()));

  // The automatic offer on the next booking: ₹350 off the first trip, then a free hour every trip
  const trips = await client.from("bookings").select("id", { count: "exact", head: true }).eq("user_id", user.sub).in("status", ["confirmed", "completed"]);
  const perk = trips.error ? null : trips.count === 0 ? { kind: "welcome", amount: WELCOME_OFF } : { kind: "free_hour" };

  // Referral rewards that just became due show up here too
  await settleReferrals(client, user.sub).catch(() => {});

  const now = new Date();
  const list = await client
    .from("coupons")
    .select("code, description, discount_type, discount_value, max_discount, min_amount, valid_from, valid_until, usage_limit, used_count, is_single_use, required_previous_coupons_used, assigned_user_id, show_in_dashboard")
    .eq("is_active", true)
    .or(`show_in_dashboard.eq.true,assigned_user_id.eq.${user.sub}`);
  if (notSetUp(list.error)) return NextResponse.json({ setup: true, perk, offers: [], mine: [], used });
  if (list.error) return failed();

  const usable = list.data.filter((c) => {
    if (c.valid_from && new Date(c.valid_from) > now) return false;
    if (c.valid_until && new Date(c.valid_until) < now) return false;
    if (c.usage_limit !== null && c.used_count >= c.usage_limit) return false;
    if (c.is_single_use && usedCodes.has(String(c.code).toUpperCase())) return false;
    const need = c.required_previous_coupons_used;
    if (need !== null && need !== undefined && need >= 0 && paid.length !== need) return false; // e.g. first-coupon-only offers
    return true;
  });

  return NextResponse.json({
    perk,
    offers: usable.filter((c) => !c.assigned_user_id).map(view),
    mine: usable.filter((c) => c.assigned_user_id === user.sub).map(view),
    used,
  });
}
