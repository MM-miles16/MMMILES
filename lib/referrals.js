// Referral programme (2026-11-17): the person who invites gets a ₹200 bonus for their next booking
// once the friend completes their first trip. The friend gets the ₹350 first-trip offer every new
// customer gets (lib/offers.js). Codes are random (no lookalike characters); the bonus is a
// personal, single-use coupon.
import crypto from "crypto";

export const REFERRAL_REWARD = 200;
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O or 1/I

export function randomCode(length) {
  const bytes = crypto.randomBytes(length);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

export const isReferralCode = (code) => /^[A-Z0-9]{6,12}$/.test(String(code || "").toUpperCase());

// The user's own invite code, created on first use
export async function ensureReferralCode(db, userId) {
  const existing = await db.from("referral_codes").select("code").eq("user_id", userId).maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data) return existing.data.code;
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = `MM${randomCode(6)}`;
    const inserted = await db.from("referral_codes").insert({ user_id: userId, code }).select("code").single();
    if (!inserted.error) return inserted.data.code;
    if (inserted.error.code !== "23505") throw inserted.error; // not a duplicate
    const again = await db.from("referral_codes").select("code").eq("user_id", userId).maybeSingle();
    if (again.data) return again.data.code; // created by a parallel request
  }
  throw new Error("Could not create a referral code");
}

// Called at a first login: link the new user to whoever invited them (never fails the login)
export async function recordReferral(db, code, newUserId) {
  if (!isReferralCode(code) || !newUserId) return;
  const { data: owner } = await db.from("referral_codes").select("user_id").eq("code", String(code).toUpperCase()).maybeSingle();
  if (!owner?.user_id || owner.user_id === newUserId) return;
  const { error } = await db.from("referrals").insert({ referrer_id: owner.user_id, referred_id: newUserId });
  if (error && error.code !== "23505") console.error("Referral not recorded:", error.message);
}

// The discount_type a flat (₹) coupon uses in this database, copied from an existing one
async function flatDiscountType(db) {
  const { data } = await db.from("coupons").select("discount_type").neq("discount_type", "percentage").limit(1);
  return data?.[0]?.discount_type || "fixed";
}

// Issue the ₹200 bonus for referrals whose friend has finished a trip. Called when either person
// opens their dashboard. Safe to call on every visit: a referral is claimed (joined → rewarded)
// before its coupon is created.
export async function settleReferrals(db, userId) {
  const { data: open, error } = await db
    .from("referrals")
    .select("id, referrer_id, referred_id")
    .eq("status", "joined")
    .or(`referrer_id.eq.${userId},referred_id.eq.${userId}`);
  if (error) throw error;
  if (!open?.length) return;

  const now = new Date().toISOString();
  let discountType = null;
  for (const r of open) {
    const { data: trips } = await db
      .from("bookings")
      .select("id")
      .eq("user_id", r.referred_id)
      .in("status", ["confirmed", "completed"])
      .lt("end_time", now)
      .limit(1);
    if (!trips?.length) continue;

    const { data: claimed } = await db.from("referrals").update({ status: "rewarded", rewarded_at: now }).eq("id", r.id).eq("status", "joined").select("id");
    if (!claimed?.length) continue; // another request got there first

    discountType ??= await flatDiscountType(db);
    const coupon = (owner) => ({
      code: `MMREF${randomCode(6)}`,
      description: `Referral bonus: ₹${REFERRAL_REWARD} off your next booking`,
      discount_type: discountType,
      discount_value: REFERRAL_REWARD,
      min_amount: 0,
      is_active: true,
      valid_from: now,
      usage_limit: 1,
      used_count: 0,
      is_single_use: true,
      assigned_user_id: owner,
      show_in_dashboard: false,
    });
    const bonus = coupon(r.referrer_id);
    const { error: couponError } = await db.from("coupons").insert([bonus]);
    if (couponError) {
      console.error("Referral bonus coupon not created:", couponError.message);
      await db.from("referrals").update({ status: "joined", rewarded_at: null }).eq("id", r.id); // retry next visit
      continue;
    }
    await db.from("referrals").update({ referrer_coupon: bonus.code }).eq("id", r.id);
  }
}

// The inviter's bonuses from their referral rows ({ referrer_coupon, rewarded_at }), newest first,
// with whether each has been used on a paid booking
export async function listBonuses(db, userId, rows) {
  const earned = rows.filter((r) => r.referrer_coupon).sort((a, b) => String(b.rewarded_at).localeCompare(String(a.rewarded_at)));
  if (!earned.length) return [];
  const { data: used } = await db
    .from("bookings")
    .select("id, booking_code, applied_coupon, created_at")
    .eq("user_id", userId)
    .in("status", ["confirmed", "completed"])
    .in("applied_coupon", earned.map((r) => r.referrer_coupon));
  const usedOn = new Map((used || []).map((b) => [b.applied_coupon, { bookingCode: b.booking_code || `#${b.id}`, date: b.created_at }]));
  return earned.map((r) => ({
    code: r.referrer_coupon,
    value: REFERRAL_REWARD,
    earnedAt: r.rewarded_at,
    used: usedOn.has(r.referrer_coupon),
    usedOn: usedOn.get(r.referrer_coupon) || null,
  }));
}
