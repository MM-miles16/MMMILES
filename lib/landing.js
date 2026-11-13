// Server-side data for the redesigned homepage: live fleet numbers, internal links and FAQs.
// Prices come from Supabase (refreshed hourly) so the page never advertises a stale "from" price.
import { cars as carModels, carTypes } from "@/lib/cars";
import { getCityBySlug } from "@/lib/cities";
import { allInPrice, WEEKEND_SURGE } from "@/lib/tripPrice";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const formatINR = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

// Which live cars count towards each /cities/{city}/{type} page
const TYPE_MATCHERS = {
  suv: (v) => /suv/i.test(v.vehicle_type || ""),
  sedan: (v) => /sedan/i.test(v.vehicle_type || ""),
  hatchback: (v) => /hatch/i.test(v.vehicle_type || ""),
  luxury: (v) => /luxury/i.test(v.vehicle_type || ""),
  automatic: (v) => /auto/i.test(v.transmission_type || ""),
  cheap: () => true,
  electric: (v) => /electric/i.test(v.fuel_type || ""),
  "7-seater": (v) => v.seating_capacity >= 7,
};

// "Maruti Suzuki Fronx" → "maruti-fronx"; only returns slugs that have a /rent page
const knownSlugs = new Set(carModels.map((c) => c.slug));
function modelSlug(make, model) {
  const slug = `${make} ${model}`
    .toLowerCase()
    .replace(/maruti suzu?ki/, "maruti")
    .replace(/toyota innova/, "innova")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return knownSlugs.has(slug) ? slug : null;
}

/**
 * Live bookable fleet for a city (Supabase `vehicles`, available_status = true).
 * Returns null if Supabase is unreachable — callers must render without prices.
 */
export async function getFleetSummary(city = "Chennai") {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  try {
    const url = new URL(`${SUPABASE_URL}/rest/v1/vehicles`);
    url.searchParams.set("city", `eq.${city}`);
    url.searchParams.set("available_status", "eq.true");
    url.searchParams.set("select", "make,model,vehicle_type,fuel_type,transmission_type,seating_capacity,base_daily_rate");
    const res = await fetch(url, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const rows = (await res.json()).filter((v) => v.base_daily_rate > 0);
    if (rows.length === 0) return null;

    // All-in price of a 1-day trip (GST, insurance, fees) for the cheapest car in the list —
    // every part of the price grows with the base rate, so the cheapest base gives the cheapest total
    const minRate = (list) => (list.length ? allInPrice(Math.min(...list.map((v) => v.base_daily_rate))) : null);
    const models = [];
    for (const v of rows) {
      const slug = modelSlug(v.make, v.model);
      if (slug && !models.some((m) => m.slug === slug)) {
        models.push({ slug, name: carModels.find((c) => c.slug === slug).name });
      }
    }

    // Lowest base rate per model ("hyundai venue" → 2460), for illustrations that show real prices
    const rates = {};
    for (const v of rows) {
      const key = `${v.make} ${v.model}`.toLowerCase();
      rates[key] = Math.min(rates[key] ?? Infinity, v.base_daily_rate);
    }

    return {
      city,
      count: rows.length,
      rates,
      from: minRate(rows),
      fromByType: {
        hatchback: minRate(rows.filter(TYPE_MATCHERS.hatchback)),
        sedan: minRate(rows.filter(TYPE_MATCHERS.sedan)),
        suv: minRate(rows.filter(TYPE_MATCHERS.suv)),
      },
      // Car-type pages that actually have cars behind them
      types: carTypes.filter((t) => rows.some(TYPE_MATCHERS[t.slug] || (() => false))),
      models,
    };
  } catch (err) {
    console.error("getFleetSummary failed:", err);
    return null;
  }
}

/** Area links for a city, from lib/cities */
export function getAreas(citySlug = "chennai") {
  return getCityBySlug(citySlug)?.areas.map((a) => ({ slug: a.slug, name: a.name })) || [];
}

/** Road trips from a city (distances from lib/cities) with photo + guide links where we have them */
const TRIP_EXTRAS = {
  "ECR Beach": { image: "/landing/trips/ecr.webp" },
  "Mahabalipuram": { image: "/landing/trips/mahabalipuram.webp" },
  "Pondicherry": { image: "/landing/trips/pondicherry.webp", href: "/blog/chennai-to-pondicherry" },
  "Yercaud": { image: "/landing/trips/yercaud.webp" },
  "Kodaikanal": { image: "/landing/trips/kodaikanal.webp" },
  "Ooty": { image: "/landing/trips/ooty.webp", href: "/blog/ooty-self-drive-guide-bangalore-chennai-2026" },
};
export function getRoadTrips(citySlug = "chennai") {
  const destinations = getCityBySlug(citySlug)?.popularDestinations || [];
  return destinations
    .filter((d) => TRIP_EXTRAS[d.name])
    .map((d) => ({ ...d, ...TRIP_EXTRAS[d.name] }))
    .sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
}

/** Homepage FAQs — one list feeds both the visible accordion and the FAQPage schema */
export function getHomeFaqs(summary) {
  const t = summary?.fromByType || {};
  const typePrices = [
    t.hatchback && `hatchbacks from ${formatINR(t.hatchback)}`,
    t.sedan && `sedans from ${formatINR(t.sedan)}`,
    t.suv && `SUVs from ${formatINR(t.suv)}`,
  ].filter(Boolean);

  return [
    {
      q: "How much does a self-drive car cost in Chennai?",
      a: summary
        ? `A one-day rental currently starts at ${formatINR(summary.from)} all-in${typePrices.length ? ` (${typePrices.join(", ")})` : ""}. That includes GST, insurance and fees, and longer trips cost less per day.`
        : "Prices depend on the car and how long you rent it. You see the full price, including GST, insurance and fees, before you pay.",
    },
    {
      q: "Do I need to pay a security deposit?",
      a: "No. MM Miles doesn't take a security deposit at any stage of the booking or the trip. You only pay for the rental.",
    },
    {
      q: "Do you deliver the car to my home?",
      a: "Yes. We deliver to your doorstep across Chennai, including Anna Nagar, Velachery, OMR, T Nagar, Adyar, Porur, Tambaram and Ambattur, and collect the car when you're done.",
    },
    {
      q: "What documents do I need?",
      a: "A valid driving licence and an Aadhaar card or another government ID. Please keep the originals with you when the car is handed over.",
    },
    {
      q: "Is there a kilometre limit?",
      a: "Most cars come with unlimited kilometres. If a premium car has a limit, it's shown clearly before you book.",
    },
    {
      q: "How long can I rent a car for?",
      a: "From 6 hours up to a month. Longer trips cost less per day: rates drop 5% for 3–6 days, 15% for 7–13 days and 20% for 14 days or more.",
    },
    {
      q: "Do prices change on weekends?",
      a: `Yes. From Friday 6 PM to Monday 6 AM, the rental part of the price is ${Math.round(WEEKEND_SURGE * 100)}% higher. Insurance and fees stay the same, and you always see the full price, including any weekend rate, before you pay.`,
    },
    {
      q: "What is the minimum age to rent a car?",
      a: "You need to be at least 18 and hold a valid Indian driving licence.",
    },
    {
      q: "How does the fuel policy work?",
      a: "Cars are handed over with fuel. Please return the car with the same fuel level; any shortfall is charged.",
    },
  ];
}
