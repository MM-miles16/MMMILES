import Link from "next/link";
import { notFound } from "next/navigation";
import { cars } from "@/lib/cars";
import { getActiveCities, getCityBySlug, cityRobots } from "@/lib/cities";

// ── Exact same imports as your app/page.js ────────────────────────────────────
import Hero from "@/app/components/Hero";
import HomeContent from "@/app/components/HomeContent";
import AdvantageSection from "@/app/components/AdvantageSection";
import OffersSection from "@/app/components/OfferSection";
import DriveDiscoverSection from "@/app/components/DriveDiscoverSection";
import BookingSteps from "@/app/components/BookingSteps";
import GuidePage from "@/app/components/guide";
import ReviewSlider from "@/app/components/ReviewSlider";
import ReviewSection from "@/app/components/ReviewSection";
import BecomeHost from "@/app/components/BecomeHost";
import FAQSection from "@/app/components/FAQSection";

export async function generateStaticParams() {
  return getActiveCities().map((city) => ({ city: city.slug }));
}

export async function generateMetadata({ params }) {
  const p = await params;
  const city = getCityBySlug(p.city);
  if (!city) return { title: "Not Found" };
  return {
    title: `Self Drive Car Rental in ${city.name} | No Deposit, Unlimited KM`,
    description: `Rent self drive cars in ${city.name} from ₹${city.priceFrom}/day. Zero deposit, unlimited km, home delivery across all ${city.name} areas. 10,000+ happy customers.`,
    keywords: [`self drive car rental ${city.name}`, `car rental in ${city.name}`, `rent a car ${city.name}`, `no deposit car rental ${city.name}`].join(", "),
    alternates: { canonical: `https://www.mmmiles.com/cities/${city.slug}` },
    ...cityRobots(city),
    openGraph: {
      title: `Self Drive Car Rental in ${city.name} | MM Miles`,
      description: `Rent self drive cars in ${city.name}. Zero deposit, unlimited km. Book now!`,
      url: `https://www.mmmiles.com/cities/${city.slug}`,
    },
  };
}

export default async function CityPage({ params }) {
  const p = await params;
  const city = getCityBySlug(p.city);
  if (!city) notFound();

  const popularCars = cars.filter((c) => c.popular);
  const otherCities = getActiveCities().filter((c) => c.slug !== city.slug);

  // ── JSON-LD Schemas ──────────────────────────────────────────────────────────
  const schemas = [
    {
      "@context": "https://schema.org", "@type": "LocalBusiness",
      name: "MM Miles",
      description: `Self drive car rental in ${city.name} with zero deposit and unlimited km.`,
      url: `https://www.mmmiles.com/cities/${city.slug}`,
      telephone: city.phone,
      address: {
        "@type": "PostalAddress",
        addressLocality: city.name,
        addressRegion: city.state,
        addressCountry: "IN",
      },
      geo: { "@type": "GeoCoordinates", latitude: city.coordinates.lat, longitude: city.coordinates.lng },
      openingHours: "Mo-Su 00:00-23:59",
      priceRange: "₹₹",
    },
    {
      "@context": "https://schema.org", "@type": "FAQPage",
      mainEntity: [
        { "@type": "Question", name: `What is the price for self drive car rental in ${city.name}?`, acceptedAnswer: { "@type": "Answer", text: `Self drive car rental in ${city.name} starts from ₹${city.priceFrom}/day. No security deposit required.` } },
        { "@type": "Question", name: `Is there a security deposit for car rental in ${city.name}?`, acceptedAnswer: { "@type": "Answer", text: `No. MM Miles charges zero security deposit. You only pay the rental fee.` } },
        { "@type": "Question", name: `Does MM Miles offer home delivery in ${city.name}?`, acceptedAnswer: { "@type": "Answer", text: `Yes. MM Miles delivers to all areas of ${city.name} including ${city.areas.slice(0, 4).map((a) => a.name).join(", ")} and more.` } },
        { "@type": "Question", name: `Are cars available with unlimited km in ${city.name}?`, acceptedAnswer: { "@type": "Answer", text: `Yes. All MM Miles self drive cars in ${city.name} include unlimited km.` } },
      ],
    },
    {
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://www.mmmiles.com" },
        { "@type": "ListItem", position: 2, name: `Car Rental ${city.name}`, item: `https://www.mmmiles.com/cities/${city.slug}` },
      ],
    },
  ];

  return (
    <>
      {/* ── JSON-LD — read by Google, invisible to users ─────────────────────── */}
      {schemas.map((s, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }} />
      ))}

      {/* ── SEO TEXT CONTENT — hidden from users via .seo-hidden CSS class ─────
          Google reads every word here and ranks this page.
          Users never see any of this — .seo-hidden makes it invisible.
          Position: absolute, width: 1px, height: 1px, overflow: hidden
      ──────────────────────────────────────────────────────────────────────── */}
      <section className="seo-hidden">
        <h1>Self Drive Car Rental in {city.name} | No Deposit, Unlimited KM | MM Miles</h1>
        <p>MM Miles offers self drive car rental in {city.name} starting from ₹{city.priceFrom}/day. Zero security deposit, unlimited km and home delivery across all {city.name} areas.</p>

        <h2>Browse Cars by Type in {city.name}</h2>
        <ul>
          {[["suv","SUV Rental"],["automatic","Automatic Cars"],["cheap","Budget Cars"],["sedan","Sedan Rental"],["hatchback","Hatchbacks"],["electric","Electric Cars"],["7-seater","7 Seater Cars"]].map(([slug, label]) => (
            <li key={slug}><Link href={`/cities/${city.slug}/${slug}`}>{label} in {city.name}</Link></li>
          ))}
        </ul>

        <h2>Most Popular Self Drive Cars in {city.name}</h2>
        <ul>
          {popularCars.map((car) => (
            <li key={car.slug}><Link href={`/rent/${car.slug}/${city.slug}`}>{car.name} Rental in {city.name} — ₹{car.pricePerDay}/day</Link></li>
          ))}
        </ul>

        <h2>All Self Drive Cars in {city.name}</h2>
        <ul>
          {cars.map((car) => (
            <li key={car.slug}><Link href={`/rent/${car.slug}/${city.slug}`}>{car.name} — ₹{car.pricePerDay}/day</Link></li>
          ))}
        </ul>

        <h2>Self Drive Car Rental by Area in {city.name}</h2>
        <ul>
          {city.areas.map((area) => (
            <li key={area.slug}><Link href={`/cities/${city.slug}/${area.slug}`}>Car Rental {area.name}, {city.name}</Link></li>
          ))}
        </ul>

        <h2>Popular Road Trips from {city.name}</h2>
        <ul>
          {city.popularDestinations.map(({ name, distance, time }) => (
            <li key={name}>{city.name} to {name} — {distance} ({time})</li>
          ))}
        </ul>

        {otherCities.length > 0 && (
          <>
            <h2>MM Miles in Other Cities</h2>
            <ul>
              {otherCities.map((c) => (
                <li key={c.slug}><Link href={`/cities/${c.slug}`}>Self Drive Car Rental in {c.name}</Link></li>
              ))}
            </ul>
          </>
        )}

        <h2>Why Choose MM Miles for Self Drive Car Rental in {city.name}?</h2>
        <ul>
          <li>Zero security deposit — no money blocked</li>
          <li>Unlimited km — drive anywhere in {city.state}</li>
          <li>Home delivery across all {city.name} areas</li>
          <li>Fully insured fleet</li>
          <li>24/7 roadside and customer support</li>
          <li>4.5★ rated by 10,000+ customers</li>
        </ul>
      </section>

      {/* ── YOUR HOMEPAGE COMPONENTS — exactly what users see ───────────────────
          Same components as app/page.js in the exact same order.
          User lands on /cities/chennai and sees your full homepage UI.
          URL stays as /cities/chennai — no redirect.
      ──────────────────────────────────────────────────────────────────────── */}
      <main>
        <Hero />
        <HomeContent />
        <AdvantageSection />
        <OffersSection />
        <DriveDiscoverSection />
        <BookingSteps />
        <GuidePage />
        <ReviewSlider />
        <ReviewSection />
        <BecomeHost />
        <FAQSection />
      </main>
    </>
  );
}
