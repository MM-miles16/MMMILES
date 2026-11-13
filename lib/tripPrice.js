// Display helpers for all-in trip prices.
// Uses the same maths as checkout (lib/pricing.js → create-order), so the number on a card
// is what the customer pays before any coupon: rental + insurance + convenience fee + GST.
import { calculatePricing, countWeekendHours, estimatePrice, WEEKEND_SURGE } from "./pricing";

export { WEEKEND_SURGE };

export const MIN_TRIP_HOURS = 6; // same minimum as checkout

const INR = (n) => `₹${Math.round(n).toLocaleString("en-IN")}`;
export { INR as formatINR };

/** "DD/MM/YYYY HH:MM" (the SearchBar / URL format) → Date, or null */
export function parseTripDateTime(str) {
  if (!str) return null;
  const [datePart, timePart] = str.split(" ");
  const [day, month, year] = (datePart || "").split("/").map(Number);
  const [hour] = (timePart || "").split(":").map(Number);
  if (!day || !month || !year || Number.isNaN(hour)) return null;
  return new Date(year, month - 1, day, hour, 0, 0, 0);
}

/** Billable hours between two "DD/MM/YYYY HH:MM" strings, or null if invalid / under the minimum */
export function tripHours(pickupStr, returnStr) {
  const start = parseTripDateTime(pickupStr);
  const end = parseTripDateTime(returnStr);
  if (!start || !end) return null;
  const hours = Math.ceil((end - start) / 3600000);
  return hours >= MIN_TRIP_HOURS ? hours : null;
}

/** All-in weekday price for a trip of `hours` (defaults to a 1-day trip) — for "from" prices */
export function allInPrice(baseDailyRate, hours = 24) {
  if (!(baseDailyRate > 0)) return null;
  return estimatePrice(baseDailyRate, hours).total;
}

/**
 * All-in price for the customer's exact trip — the same calculation checkout uses,
 * including the weekend rate. Without valid dates (or under 6 hours) it falls back to a
 * 1-day weekday price. Returns { total, isTrip, hours, weekendHours } or null.
 */
export function tripPrice(baseDailyRate, pickupStr, returnStr) {
  if (!(baseDailyRate > 0)) return null;
  const start = parseTripDateTime(pickupStr);
  const end = parseTripDateTime(returnStr);
  const hours = start && end ? Math.ceil((end - start) / 3600000) : 0;
  if (hours >= MIN_TRIP_HOURS) {
    const p = calculatePricing({ baseDailyRate, pickupTime: start, returnTime: end });
    return { total: p.total, isTrip: true, hours, weekendHours: p.weekendHours };
  }
  return { total: estimatePrice(baseDailyRate, 24).total, isTrip: false, hours: 24, weekendHours: 0 };
}

/** Weekend hours in a trip (same rule as checkout), or 0 */
export function tripWeekendHours(pickupStr, returnStr) {
  const hours = tripHours(pickupStr, returnStr);
  return hours ? countWeekendHours(parseTripDateTime(pickupStr), hours) : 0;
}

/** Friends splitting the trip: 4 in a 5-seater, 6 in a 7/8-seater (rounded up per person) */
export function perPerson(total, seats) {
  const people = seats >= 7 ? 6 : 4;
  return { people, each: Math.ceil(total / people) };
}

/** 30 → "1 day 6 hrs", 48 → "2 days", 8 → "8 hrs" */
export function formatDuration(hours) {
  const days = Math.floor(hours / 24);
  const rest = hours % 24;
  const d = days ? `${days} day${days > 1 ? "s" : ""}` : "";
  const h = rest ? `${rest} hr${rest > 1 ? "s" : ""}` : "";
  return [d, h].filter(Boolean).join(" ");
}
