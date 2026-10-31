import Link from "next/link";
import { notFound } from "next/navigation";
import { cars, getCarBySlug } from "@/lib/cars";
import { getActiveCities, getCityBySlug, cityRobots } from "@/lib/cities";

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
  const params = [];
  const activeCities = getActiveCities();
  cars.forEach((car) => {
    activeCities.forEach((city) => params.push({ slug: car.slug, city: city.slug }));
  });
  return params;
}

export async function generateMetadata({ params }) {
  const p = await params;
  const car = getCarBySlug(p.slug);
  const city = getCityBySlug(p.city);
  if (!car || !city) return { title: "Not Found" };
  return {
    title: `${car.name} Rental in ${city.name} | Self Drive | No Deposit`,
    description: `Rent ${car.name} in ${city.name} from ₹${car.pricePerDay}/day. Zero deposit, unlimited km, home delivery across ${city.name}. Book in 2 minutes!`,
    keywords: [`${car.name} rental ${city.name}`, `${car.name} self drive ${city.name}`, `rent ${car.name} ${city.name}`].join(", "),
    alternates: { canonical: `https://www.mmmiles.com/rent/${car.slug}/${city.slug}` },
    ...cityRobots(city),
    openGraph: {
      title: `${car.name} Rental in ${city.name} | MM Miles`,
      description: `Rent ${car.name} in ${city.name}. Zero deposit, unlimited km. Book now!`,
      url: `https://www.mmmiles.com/rent/${car.slug}/${city.slug}`,
    },
  };
}

export default async function CarCityPage({ params }) {
  const p = await params;
  const car = getCarBySlug(p.slug);
  const city = getCityBySlug(p.city);
  if (!car || !city) notFound();

  const otherCities = getActiveCities().filter((c) => c.slug !== city.slug);
  const relatedCars = cars.filter((c) => c.type === car.type && c.slug !== car.slug).slice(0, 5);

  const schemas = [
    {
      "@context": "https://schema.org", "@type": "Product",
      name: `${car.name} Self Drive Rental - ${city.name}`,
      description: `Rent ${car.name} in ${city.name} for self drive. ${car.description}`,
      brand: { "@type": "Brand", name: "MM Miles" },
      offers: {
        "@type": "AggregateOffer",
        lowPrice: car.pricePerHour, highPrice: car.pricePerDay,
        priceCurrency: "INR", availability: "https://schema.org/InStock",
        areaServed: { "@type": "City", name: city.name, addressRegion: city.state, addressCountry: "IN" },
        seller: { "@type": "Organization", name: "MM Miles" },
      },
    },
    {
      "@context": "https://schema.org", "@type": "FAQPage",
      mainEntity: [
        { "@type": "Question", name: `What is the price to rent ${car.name} in ${city.name}?`, acceptedAnswer: { "@type": "Answer", text: `₹${car.pricePerHour}/hour or ₹${car.pricePerDay}/day. No security deposit required.` } },
        { "@type": "Question", name: `Is there a security deposit for ${car.name} in ${city.name}?`, acceptedAnswer: { "@type": "Answer", text: `No. MM Miles charges zero security deposit in ${city.name}.` } },
        { "@type": "Question", name: `Does MM Miles offer home delivery of ${car.name} in ${city.name}?`, acceptedAnswer: { "@type": "Answer", text: `Yes. We deliver ${car.name} to your doorstep across all areas of ${city.name}.` } },
        { "@type": "Question", name: `Is ${car.name} rental unlimited km in ${city.name}?`, acceptedAnswer: { "@type": "Answer", text: `Yes. All rentals in ${city.name} include unlimited km.` } },
      ],
    },
    {
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://www.mmmiles.com" },
        { "@type": "ListItem", position: 2, name: `Car Rental ${city.name}`, item: `https://www.mmmiles.com/cities/${city.slug}` },
        { "@type": "ListItem", position: 3, name: `${car.name} ${city.name}`, item: `https://www.mmmiles.com/rent/${car.slug}/${city.slug}` },
      ],
    },
  ];

  return (
    <>
      {schemas.map((s, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }} />
      ))}

      {/* ── SEO CONTENT — hidden from users via .seo-hidden ──────────────────── */}
      <section className="seo-hidden">
        <h1>{car.name} Rental in {city.name} | Self Drive | No Deposit</h1>
        <p>Rent {car.name} in {city.name} starting from ₹{car.pricePerHour}/hour or ₹{car.pricePerDay}/day. Zero deposit, unlimited km, home delivery across all {city.name} areas. Fully insured.</p>

        <h2>Why Rent {car.name} from MM Miles in {city.name}?</h2>
        <ul>
          <li>Zero security deposit — no money blocked</li>
          <li>Unlimited km — drive anywhere in {city.state}</li>
          <li>Home delivery across all {city.name} areas</li>
          <li>Fully insured {car.name} — no hidden charges</li>
          <li>24/7 roadside assistance in {city.name}</li>
        </ul>

        <h2>About {car.name}</h2>
        <ul>
          <li>Transmission: {car.transmission}</li>
          <li>Seats: {car.seats}</li>
          <li>Fuel: {car.fuel}</li>
          <li>Features: {car.features.join(", ")}</li>
        </ul>

        <h2>Popular Road Trips from {city.name} in {car.name}</h2>
        <ul>
          {city.popularDestinations.map(({ name, distance, time }) => (
            <li key={name}>{city.name} to {name} — {distance} ({time})</li>
          ))}
        </ul>

        <h2>{car.name} Delivery Areas in {city.name}</h2>
        <ul>
          {city.areas.map((area) => (
            <li key={area.slug}><Link href={`/cities/${city.slug}/${area.slug}`}>{area.name}</Link></li>
          ))}
        </ul>

        {otherCities.length > 0 && (
          <>
            <h2>Rent {car.name} in Other Cities</h2>
            <ul>
              {otherCities.map((c) => (
                <li key={c.slug}><Link href={`/rent/${car.slug}/${c.slug}`}>{car.name} Rental in {c.name}</Link></li>
              ))}
            </ul>
          </>
        )}

        {relatedCars.length > 0 && (
          <>
            <h2>Other {car.type} Cars in {city.name}</h2>
            <ul>
              {relatedCars.map((c) => (
                <li key={c.slug}><Link href={`/rent/${c.slug}/${city.slug}`}>{c.name} Rental in {city.name} — ₹{c.pricePerDay}/day</Link></li>
              ))}
            </ul>
          </>
        )}
      </section>

      {/* ── YOUR HOMEPAGE COMPONENTS — exactly what users see ───────────────── */}
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
