import Link from "next/link";
import { notFound } from "next/navigation";
import { cars, carTypes, getCarsByType } from "@/lib/cars";
import { getActiveCities, getCityBySlug, getAreaBySlug, cityRobots } from "@/lib/cities";

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
  getActiveCities().forEach((city) => {
    city.areas.forEach((area) => params.push({ city: city.slug, segment: area.slug }));
    carTypes.forEach((type) => params.push({ city: city.slug, segment: type.slug }));
  });
  return params;
}

export async function generateMetadata({ params }) {
  const p = await params;
  const city = getCityBySlug(p.city);
  if (!city) return { title: "Not Found" };

  const typeData = carTypes.find((t) => t.slug === p.segment);
  if (typeData) {
    return {
      title: `${typeData.name} Rental in ${city.name} | Self Drive | No Deposit`,
      description: `Rent ${typeData.name.toLowerCase()} cars in ${city.name}. Zero deposit, unlimited km, home delivery. From ₹${city.priceFrom}/day.`,
      alternates: { canonical: `https://www.mmmiles.com/cities/${city.slug}/${p.segment}` },
      ...cityRobots(city),
    };
  }

  const area = getAreaBySlug(p.city, p.segment);
  if (area) {
    return {
      title: `Car Rental in ${area.name}, ${city.name} | Self Drive | No Deposit`,
      description: `Self drive car rental in ${area.name}, ${city.name}. Home delivery to ${area.name}. Zero deposit, unlimited km. Book in 2 minutes!`,
      keywords: [`car rental ${area.name} ${city.name}`, `self drive car ${area.name}`, `car rental near ${area.name}`].join(", "),
      alternates: { canonical: `https://www.mmmiles.com/cities/${city.slug}/${area.slug}` },
      ...cityRobots(city),
      openGraph: {
        title: `Car Rental in ${area.name}, ${city.name} | MM Miles`,
        description: `Self drive car rental in ${area.name}, ${city.name}. Zero deposit, home delivery.`,
        url: `https://www.mmmiles.com/cities/${city.slug}/${area.slug}`,
      },
    };
  }

  return { title: "Not Found" };
}

export default async function SegmentPage({ params }) {
  const p = await params;
  const city = getCityBySlug(p.city);
  if (!city) notFound();

  const typeData = carTypes.find((t) => t.slug === p.segment);
  const area = getAreaBySlug(p.city, p.segment);
  if (!typeData && !area) notFound();

  const popularCars = cars.filter((c) => c.popular);
  const typeCars = typeData ? getCarsByType(p.segment) : [];
  const otherTypes = carTypes.filter((t) => t.slug !== p.segment);
  const nearbyAreas = city.areas.filter((a) => a.slug !== p.segment).slice(0, 10);

  const schemas = [
    {
      "@context": "https://schema.org", "@type": "LocalBusiness",
      name: "MM Miles",
      description: area
        ? `Self drive car rental in ${area.name}, ${city.name}.`
        : `${typeData?.name} rental in ${city.name}.`,
      url: `https://www.mmmiles.com/cities/${city.slug}/${p.segment}`,
      telephone: city.phone,
      address: { "@type": "PostalAddress", addressLocality: city.name, addressRegion: city.state, addressCountry: "IN" },
      geo: { "@type": "GeoCoordinates", latitude: city.coordinates.lat, longitude: city.coordinates.lng },
      openingHours: "Mo-Su 00:00-23:59", priceRange: "₹₹",
    },
    {
      "@context": "https://schema.org", "@type": "FAQPage",
      mainEntity: area ? [
        { "@type": "Question", name: `Does MM Miles offer car rental in ${area.name}, ${city.name}?`, acceptedAnswer: { "@type": "Answer", text: `Yes. Zero deposit, unlimited km, home delivery in ${area.name}, ${city.name}.` } },
        { "@type": "Question", name: `What is the price for car rental in ${area.name}?`, acceptedAnswer: { "@type": "Answer", text: `Starts from ₹${city.priceFrom}/day. No security deposit required.` } },
        { "@type": "Question", name: `Can I get a car delivered to my home in ${area.name}?`, acceptedAnswer: { "@type": "Answer", text: `Yes. We deliver to your door in ${area.name} within 2 hours of booking.` } },
      ] : [
        { "@type": "Question", name: `What ${typeData?.name} cars are available in ${city.name}?`, acceptedAnswer: { "@type": "Answer", text: `MM Miles has ${typeCars.length} ${typeData?.name} options in ${city.name} with zero deposit and unlimited km.` } },
        { "@type": "Question", name: `Is there a security deposit for ${typeData?.name} rental in ${city.name}?`, acceptedAnswer: { "@type": "Answer", text: `No. MM Miles charges zero security deposit in ${city.name}.` } },
      ],
    },
    {
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://www.mmmiles.com" },
        { "@type": "ListItem", position: 2, name: `Car Rental ${city.name}`, item: `https://www.mmmiles.com/cities/${city.slug}` },
        { "@type": "ListItem", position: 3, name: area ? area.name : typeData?.name, item: `https://www.mmmiles.com/cities/${city.slug}/${p.segment}` },
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
        {area ? (
          <>
            <h1>Self Drive Car Rental in {area.name}, {city.name}</h1>
            <p>Rent self drive cars in {area.name}, {city.name} starting from ₹{city.priceFrom}/day. Home delivery to {area.name}. Zero deposit, unlimited km. Serving {area.landmarks?.join(", ")}.</p>

            <h2>Car Types Available in {area.name}</h2>
            <ul>
              {carTypes.map((t) => (
                <li key={t.slug}><Link href={`/cities/${city.slug}/${t.slug}`}>{t.name} Rental in {area.name}</Link></li>
              ))}
            </ul>

            <h2>Popular Cars in {area.name}, {city.name}</h2>
            <ul>
              {popularCars.map((car) => (
                <li key={car.slug}><Link href={`/rent/${car.slug}/${city.slug}`}>{car.name} Self Drive in {city.name} — ₹{car.pricePerDay}/day</Link></li>
              ))}
            </ul>

            <h2>Why Choose MM Miles in {area.name}?</h2>
            <ul>
              <li>Doorstep delivery to {area.name} — no hub visit needed</li>
              <li>Zero security deposit — no money blocked</li>
              <li>Unlimited km — drive to {city.popularDestinations[0]?.name} and back</li>
              <li>Fully insured fleet — drive worry-free</li>
              <li>24/7 roadside assistance across {city.name}</li>
            </ul>

            <h2>Popular Road Trips from {area.name}, {city.name}</h2>
            <ul>
              {city.popularDestinations.map(({ name, distance, time }) => (
                <li key={name}>{area.name} to {name} — {distance} ({time})</li>
              ))}
            </ul>

            <h2>Car Rental in Nearby Areas of {city.name}</h2>
            <ul>
              {nearbyAreas.map((a) => (
                <li key={a.slug}><Link href={`/cities/${city.slug}/${a.slug}`}>Car Rental {a.name}, {city.name}</Link></li>
              ))}
            </ul>
          </>
        ) : (
          <>
            <h1>{typeData.name} Rental in {city.name} | Self Drive</h1>
            <p>Rent {typeData.name.toLowerCase()} cars in {city.name} starting from ₹{city.priceFrom}/day. Zero deposit, unlimited km, home delivery across {city.name}.</p>

            <h2>All {typeData.name} Cars in {city.name}</h2>
            <ul>
              {typeCars.map((car) => (
                <li key={car.slug}><Link href={`/rent/${car.slug}/${city.slug}`}>{car.name} in {city.name} — ₹{car.pricePerDay}/day · {car.seats} Seats</Link></li>
              ))}
            </ul>

            <h2>Other Car Types in {city.name}</h2>
            <ul>
              {otherTypes.map(({ slug, name }) => (
                <li key={slug}><Link href={`/cities/${city.slug}/${slug}`}>{name} Rental in {city.name}</Link></li>
              ))}
            </ul>

            <h2>{typeData.name} Rental by Area in {city.name}</h2>
            <ul>
              {city.areas.map((a) => (
                <li key={a.slug}><Link href={`/cities/${city.slug}/${a.slug}`}>{typeData.name} Rental {a.name}</Link></li>
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
