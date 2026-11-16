// Where a visitor's search starts, so prices, trip totals and "Book" work straight away
// without filling in the search bar first:
//   • a search saved earlier in this visit (sessionStorage "lastSearchParams") wins;
//   • otherwise Chennai, T Nagar, tomorrow 9 AM → the day after, 9 AM.
// City pages (/cities/chennai, …) pass their own city, which beats both.
import { canonicalCity, isBookableCity } from "./cities";
import { formatDateTimeForDisplay, parseDateFromSessionStorage } from "./dateUtils";

export const DEFAULT_CITY = "Chennai";
// Starting spot per city (approximate area centres; used for "km away" sorting in search)
const DEFAULT_PLACES = {
  Chennai: { address: "T Nagar, Chennai", lat: 13.0418, lon: 80.2341 },
  Bengaluru: { address: "Koramangala, Bengaluru", lat: 12.9352, lon: 77.6245 },
};

const SAVED_KEY = "lastSearchParams";
const MIN_TRIP_MS = 6 * 3600000;

// The default pickup spot for a city (Chennai: T Nagar, Bengaluru: Koramangala; others: none)
export function defaultPlaceFor(city) {
  const place = DEFAULT_PLACES[canonicalCity(city)];
  return place ? { ...place } : null;
}

// Tomorrow 9 AM → the day after, 9 AM (the search bar's "Tomorrow" chip)
export function defaultTrip(now = new Date()) {
  const start = new Date(now);
  start.setDate(start.getDate() + 1);
  start.setHours(9, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

// A trip the car page and checkout accept: pickup still ahead, at least 6 hours long
export function isValidTrip(start, end, now = new Date()) {
  return Boolean(start && end && !isNaN(start) && !isNaN(end) && start > now && end - start >= MIN_TRIP_MS);
}

export const formatTripTime = (date) => formatDateTimeForDisplay(date, date.getHours()); // "DD/MM/YYYY HH:MM"
export const parseTripTime = (value) => (value ? parseDateFromSessionStorage(value) : null);

function readSaved() {
  try {
    return new URLSearchParams(sessionStorage.getItem(SAVED_KEY) || "");
  } catch {
    return new URLSearchParams();
  }
}

/**
 * The search to start from: { city, place: {address, lat, lon} | null, start, end, isDefaultTrip }.
 * Anything missing or out of date in the saved search is filled from the defaults.
 */
export function startingSearch(pageCity) {
  const saved = readSaved();
  const savedCity = saved.get("city") ? canonicalCity(saved.get("city")) : null;
  const city =
    (pageCity && isBookableCity(pageCity) && canonicalCity(pageCity)) ||
    (savedCity && isBookableCity(savedCity) && savedCity) ||
    DEFAULT_CITY;

  // The saved spot only if it belongs to this city; otherwise the city's default spot
  const lat = parseFloat(saved.get("lat"));
  const lon = parseFloat(saved.get("lon"));
  const place =
    savedCity === city && lat && lon ? { address: saved.get("address") || "", lat, lon } : defaultPlaceFor(city);

  // Saved dates only while they're still bookable; otherwise tomorrow
  const savedStart = parseTripTime(saved.get("pickupTime"));
  const savedEnd = parseTripTime(saved.get("returnTime"));
  const keepSaved = isValidTrip(savedStart, savedEnd);
  const { start, end } = keepSaved ? { start: savedStart, end: savedEnd } : defaultTrip();

  return { city, place, start, end, isDefaultTrip: !keepSaved };
}

// The /search URL for the visitor's current search (the search bar keeps it saved), or the
// default search — same parameters as the search bar's Search button
export function searchPageUrl() {
  const s = startingSearch();
  const params = new URLSearchParams({ city: s.city, pickupTime: formatTripTime(s.start), returnTime: formatTripTime(s.end) });
  if (s.place?.lat && s.place?.lon) {
    params.set("lat", String(s.place.lat));
    params.set("lon", String(s.place.lon));
    params.set("address", s.place.address || "");
  }
  return `/search?${params}`;
}

// Saves the current search so other pages (car page, checkout) pick it up
export function rememberSearch({ city, place, start, end }) {
  const params = new URLSearchParams({ city, pickupTime: formatTripTime(start), returnTime: formatTripTime(end) });
  if (place?.lat && place?.lon) {
    params.set("lat", String(place.lat));
    params.set("lon", String(place.lon));
    params.set("address", place.address || "");
  }
  try {
    sessionStorage.setItem(SAVED_KEY, params.toString());
  } catch {
    // Private mode / storage blocked: the defaults still apply on the next page
  }
}
