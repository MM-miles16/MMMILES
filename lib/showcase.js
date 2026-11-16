// Bengaluru preview: until any Bengaluru car is live, the fleet section and search show these
// Chennai cars under Bengaluru so visitors can browse what's coming. They can't be booked there:
// the car page's Book button opens a "not available right now, contact us" popup (no checkout).
// As soon as one real Bengaluru car is switched on (available_status = true), only real cars show.
import { canonicalCity } from "./cities";

export const SHOWCASE_CITY = "Bengaluru";

// Vehicle ids from the vehicles table, in display order. `make`/`model` fix how a row's name is
// stored; `dailyRate` fills a missing base_daily_rate (null = show no price).
export const SHOWCASE_CARS = [
  { id: 40 }, // Toyota Fortuner (Chennai, switched off there)
  { id: 41 }, // Mahindra Thar Roxx (Chennai)
  { id: 56, make: "Maruti Suzuki", model: "Ertiga", dailyRate: null }, // stored as "Maruti Suzuki Maruti Suzuki Ertiga", no rate yet
  { id: 27 }, // Maruti Suzuki Swift (Chennai)
];

export const SHOWCASE_IDS = SHOWCASE_CARS.map((c) => c.id);

export const isShowcaseCity = (city) => canonicalCity(city) === SHOWCASE_CITY;

/**
 * A raw vehicles row as it should appear in the Bengaluru preview: Bengaluru as its city, the
 * name/rate fixes applied, and no map position (so search doesn't say "350 km away").
 */
export function asShowcase(row) {
  const fix = SHOWCASE_CARS.find((c) => c.id === row.id) || {};
  return {
    ...row,
    make: fix.make ?? row.make,
    model: fix.model ?? row.model,
    base_daily_rate: row.base_daily_rate ?? fix.dailyRate ?? null,
    city: SHOWCASE_CITY,
    latitude: null,
    longitude: null,
    location_name: null,
    showcase: true,
  };
}

/** True when a car is being viewed as part of the Bengaluru preview (car page). */
export function isShowcaseView(car, viewCity) {
  return Boolean(car && isShowcaseCity(viewCity) && canonicalCity(car.city) !== SHOWCASE_CITY);
}
