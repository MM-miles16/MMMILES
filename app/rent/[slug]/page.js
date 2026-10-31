import Link from "next/link";
import { notFound } from "next/navigation";
import { cars, getCarBySlug } from "@/lib/cars";
import { getActiveCities } from "@/lib/cities";

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
  return cars.map((car) => ({ slug: car.slug }));
}

export async function generateMetadata({ params }) {
  const p = await params;
  const car = getCarBySlug(p.slug);
  if (!car) return { title: "Not Found" };
  return {
    title: `${car.name} Self Drive Rental in Chennai | No Deposit`,
    description: `Rent ${car.name} for self drive from ₹${car.pricePerDay}/day. Zero deposit, unlimited km, fully insured, home delivery. Book in 2 minutes!`,
    keywords: [`${car.name} rental Chennai`, `${car.name} self drive Chennai`, `rent ${car.name} Chennai`].join(", "),
    alternates: { canonical: `https://www.mmmiles.com/rent/${car.slug}` },
    openGraph: {
      title: `${car.name} Self Drive Rental | MM Miles`,
      description: `Rent ${car.name}. Zero deposit, unlimited km. Book now!`,
      url: `https://www.mmmiles.com/rent/${car.slug}`,
    },
  };
}

export default async function RentPage({ params }) {
  const p = await params;
  const car = getCarBySlug(p.slug);
  if (!car) notFound();

  const cities = getActiveCities();
  const relatedCars = cars.filter((c) => c.type === car.type && c.slug !== car.slug).slice(0, 6);

  const schemas = [
    {
      "@context": "https://schema.org", "@type": "Product",
      name: `${car.name} Self Drive Rental`,
      description: car.description,
      brand: { "@type": "Brand", name: "MM Miles" },
      offers: { "@type": "AggregateOffer", lowPrice: car.pricePerHour, highPrice: car.pricePerDay, priceCurrency: "INR", availability: "https://schema.org/InStock" },
    },
    {
      "@context": "https://schema.org", "@type": "FAQPage",
      mainEntity: [
        { "@type": "Question", name: `What is the price to rent ${car.name}?`, acceptedAnswer: { "@type": "Answer", text: `₹${car.pricePerHour}/hour or ₹${car.pricePerDay}/day. No security deposit required.` } },
        { "@type": "Question", name: `Is there a security deposit for ${car.name} rental?`, acceptedAnswer: { "@type": "Answer", text: `No. MM Miles charges zero security deposit.` } },
        { "@type": "Question", name: `Does ${car.name} rental include unlimited km?`, acceptedAnswer: { "@type": "Answer", text: `Yes. All rentals include unlimited km.` } },
        { "@type": "Question", name: `Can I get ${car.name} home delivered?`, acceptedAnswer: { "@type": "Answer", text: `Yes. We deliver across Chennai, Coimbatore and Bangalore.` } },
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
        <h1>{car.name} Self Drive Rental in Chennai | No Deposit | MM Miles</h1>
        <p>Rent {car.name} starting from ₹{car.pricePerHour}/hour or ₹{car.pricePerDay}/day. Zero deposit, unlimited km, fully insured, home delivery. {car.description}</p>

        <h2>About {car.name}</h2>
        <ul>
          <li>Transmission: {car.transmission}</li>
          <li>Seats: {car.seats}</li>
          <li>Fuel: {car.fuel}</li>
          <li>Features: {car.features.join(", ")}</li>
          <li>Price: ₹{car.pricePerHour}/hour · ₹{car.pricePerDay}/day · ₹{car.pricePerMonth}/month</li>
        </ul>

        <h2>Rent {car.name} in Other Cities</h2>
        <ul>
          {cities.map((city) => (
            <li key={city.slug}><Link href={`/rent/${car.slug}/${city.slug}`}>{car.name} Rental in {city.name}</Link></li>
          ))}
        </ul>

        <h2>Similar {car.type} Cars</h2>
        <ul>
          {relatedCars.map((c) => (
            <li key={c.slug}><Link href={`/rent/${c.slug}`}>{c.name} Rental — ₹{c.pricePerDay}/day</Link></li>
          ))}
        </ul>

        <h2>Why Rent {car.name} from MM Miles?</h2>
        <ul>
          <li>Zero security deposit — no money blocked</li>
          <li>Unlimited km — drive anywhere</li>
          <li>Home delivery across Chennai, Coimbatore and Bangalore</li>
          <li>Fully insured {car.name}</li>
          <li>24/7 roadside assistance</li>
        </ul>
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
