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

/**
 * Homepage FAQs — the eight topics people search most before renting (Search Console, 16 months:
 * price, out-of-state trips, km limit, home delivery, insurance, documents/age, monthly rental,
 * deposit). Answers follow the published FAQ, refund and pricing rules. One list feeds both the
 * visible accordion and the FAQPage schema; the full list lives on /faq.
 */
export function getHomeFaqs(summary) {
  const surge = Math.round(WEEKEND_SURGE * 100);

  // Answers are kept to about two lines
  return [
    {
      q: "How much does a self-drive car cost per day in Chennai?",
      a: summary
        ? `A day starts at ${formatINR(summary.from)} all-in, with GST, insurance and fees included. Longer trips cost less per day; weekend rental rates are ${surge}% higher.`
        : `You see the full all-in price before you pay. Longer trips cost less per day; weekend rental rates are ${surge}% higher.`,
    },
    {
      q: "Can I take the car outside Chennai or to another state?",
      a: "Yes, with our approval before the trip. Pondicherry, Bangalore and Ooty are popular; interstate taxes, tolls and permits are paid by you.",
    },
    {
      q: "Is there a kilometre limit?",
      a: "Most cars come with unlimited kilometres. If a car has a limit, it's shown clearly before you book.",
    },
    {
      q: "Do you deliver the car to my home?",
      a: "Yes. We deliver across Chennai, including Anna Nagar, Velachery, OMR, T Nagar and Adyar, and collect the car when you're done.",
    },
    {
      q: "Is insurance included if the car gets damaged?",
      a: "Yes, standard motor insurance is included in your price. Damage from negligence, speeding or breaking traffic rules is paid by the renter.",
    },
    {
      q: "What documents do I need, and what's the minimum age?",
      a: "You need to be 18 or older, with a valid driving licence and a government ID such as Aadhaar, passport or PAN.",
    },
    {
      q: "Can I rent a self-drive car for a month?",
      a: "Yes, from 6 hours up to a month. Longer trips cost less per day, with up to 20% off for 14 days or more.",
    },
    {
      q: "Do I need to pay a security deposit?",
      a: "No. We never take a security deposit, not at booking and not during the trip. You only pay for the rental.",
    },
  ];
}
