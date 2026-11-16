// Automatic offers for every customer, no code needed (decided 2026-11-17):
//   - First trip: ₹350 off.
//   - Every trip after that: one free hour, worth one hour of that trip's rate plus the 18% GST
//     on it, so the hour really costs nothing.
// The first-trip ₹350 doesn't combine with a coupon: the bigger saving wins, and a coupon that
// loses stays unused for a later trip. From the second trip the free hour does combine with a
// coupon (for example a ₹200 referral bonus).
// Used by create-order (the amount charged), checkout (what's shown) and the dashboard.
import { GST_RATE } from "./pricing";

export const WELCOME_OFF = 350;

export const OFFER_TEXT = {
  welcome: { label: "First trip offer", note: "₹350 off, applied automatically" },
  free_hour: { label: "1 free hour", note: "One hour of every trip is on us" },
};

// Worth of one free hour for a priced trip (calculatePricing result). Uses the normal hourly rate,
// or the weekend rate when every hour of the trip falls in the weekend window.
export function freeHourValue(pricing) {
  const { adjustedHourlyRate, weekendHourlyRate } = pricing.rates;
  const rate = pricing.weekendHours >= pricing.hours ? weekendHourlyRate : adjustedHourlyRate;
  return Math.round(rate * (1 + GST_RATE));
}

// pastTrips: the customer's confirmed or completed bookings. Unknown (null) → no offer, rather
// than a wrong one.
export function offerFor(pastTrips, pricing) {
  if (pastTrips === null || pastTrips === undefined) return null;
  if (pastTrips === 0) return { kind: "welcome", amount: WELCOME_OFF, ...OFFER_TEXT.welcome };
  return { kind: "free_hour", amount: freeHourValue(pricing), ...OFFER_TEXT.free_hour };
}

// Combine the automatic offer with a coupon's discount. `cap` is the most that can come off
// (the pre-GST subtotal), so the order total never reaches zero.
export function combineDiscounts(offer, couponDiscount, cap) {
  let offerAmount = offer ? offer.amount : 0;
  let couponAmount = couponDiscount > 0 ? couponDiscount : 0;
  let couponHeld = false;
  if (offer?.kind === "welcome" && couponAmount > 0) {
    if (couponAmount > offerAmount) offerAmount = 0; // the coupon saves more
    else {
      couponAmount = 0; // the ₹350 saves more; keep the coupon for later
      couponHeld = true;
    }
  }
  offerAmount = Math.min(offerAmount, cap);
  couponAmount = Math.min(couponAmount, Math.max(0, cap - offerAmount));
  return { offerAmount: Math.round(offerAmount), couponAmount: Math.round(couponAmount), couponHeld };
}
