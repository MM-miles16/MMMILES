import Link from "next/link";
import Navbar from "./components/Navbar";
import ReviewSection from "./components/ReviewSection";
import Footer from "./components/Footer";
import DriveDiscoverSection from "./components/DriveDiscoverSection";
import FAQSection from "./components/FAQSection";
import AdvantageSection from "./components/AdvantageSection";
import Hero from "./components/Hero";
import ReviewSlider from "./components/ReviewSlider";
import BookingSteps from "./components/BookingSteps";
import BecomeHost from "./components/BecomeHost";
import OffersSection from "./components/OfferSection";
import HomeContent from "./components/HomeContent";
import GuidePage from "./components/guide";

/* =========================
   SEO METADATA
========================= */
export const metadata = {
  title: "Self Drive Car Rental in Chennai | No Deposit, Unlimited KM | MM Miles",
  description:
    "Rent self drive cars in Chennai from ₹799/day. SUVs, sedans & hatchbacks. Zero security deposit, unlimited km, home delivery across all Chennai areas. 10,000+ happy customers. Book in 2 minutes!",
  keywords: [
    "self drive car rental Chennai",
    "car rental in Chennai",
    "self drive cars Chennai",
    "rent a car Chennai",
    "no deposit car rental Chennai",
    "unlimited km car rental Chennai",
    "self drive car without driver Chennai",
    "car rental near me Chennai",
  ].join(", "),
  alternates: {
    canonical: "https://www.mmmiles.com/",
  },
  openGraph: {
    title: "Self Drive Car Rental in Chennai | No Deposit | MM Miles",
    description:
      "Rent self drive cars in Chennai from ₹799/day. Zero deposit, unlimited km, home delivery. 10,000+ happy customers.",
    url: "https://www.mmmiles.com/",
    siteName: "MM Miles",
    type: "website",
    locale: "en_IN",
    images: [
      {
        url: "/mmmiles-og.jpg",
        width: 1200,
        height: 630,
        alt: "MM Miles – Self Drive Car Rental Chennai",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Self Drive Car Rental in Chennai | MM Miles",
    description: "Rent self drive cars in Chennai. Zero deposit, unlimited km. Book now!",
    images: ["/mmmiles-og.jpg"],
  },
};

/* =========================
   PAGE COMPONENT
========================= */
export default function HomePage() {

  // ── Schema: Organization ──
  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "MM Miles",
    url: "https://www.mmmiles.com",
    logo: "https://www.mmmiles.com/goldlogo.png",
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+918050953607",
      contactType: "customer service",
      areaServed: "IN",
      availableLanguage: ["English", "Tamil"],
    },
    sameAs: [
      "https://www.instagram.com/mmmiles",
      "https://www.facebook.com/mmmiles",
    ],
  };

  // ── Schema: LocalBusiness ──
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": "https://www.mmmiles.com/#localbusiness",
    name: "MM Miles",
    description:
      "Self drive car rental in Chennai with zero security deposit, unlimited km and home delivery across all Chennai areas.",
    url: "https://www.mmmiles.com",
    telephone: "+918050953607",
    email: "Support@mmmiles.com",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Plot No: 51, VGN Nagar Phase-4, No: 62, Gurusamy Road, Nolambur",
      addressLocality: "Chennai",
      addressRegion: "Tamil Nadu",
      postalCode: "600095",
      addressCountry: "IN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 13.0827,
      longitude: 80.2707,
    },
    openingHours: "Mo-Su 00:00-23:59",
    priceRange: "₹₹",
    currenciesAccepted: "INR",
    paymentAccepted: "Cash, Credit Card, UPI",
    areaServed: {
      "@type": "City",
      name: "Chennai",
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Self Drive Car Rentals",
      itemListElement: [
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Self Drive Car Rental Chennai",
            description: "Rent self drive cars in Chennai with zero deposit and unlimited km.",
          },
          priceSpecification: {
            "@type": "PriceSpecification",
            price: "799",
            priceCurrency: "INR",
            unitText: "DAY",
          },
        },
      ],
    },
  };

  // ── Schema: WebSite (enables Sitelinks Search Box) ──
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "MM Miles",
    url: "https://www.mmmiles.com",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://www.mmmiles.com/car?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };

  // ── Schema: FAQPage ──
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is the price for self drive car rental in Chennai?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Self drive car rental in Chennai at MM Miles starts from ₹799/day. Hatchbacks from ₹799, sedans from ₹1,400 and SUVs from ₹1,600/day. No security deposit required.",
        },
      },
      {
        "@type": "Question",
        name: "Is there a security deposit for car rental in Chennai?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. MM Miles does not require any security deposit at any stage of the booking or trip. You only pay the rental fee.",
        },
      },
      {
        "@type": "Question",
        name: "Does MM Miles offer home delivery in Chennai?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. MM Miles offers doorstep delivery across all major Chennai areas including Anna Nagar, Velachery, OMR, T Nagar, Adyar, Porur, Tambaram, Ambattur, Sholinganallur and more.",
        },
      },
      {
        "@type": "Question",
        name: "What documents are needed to rent a self drive car in Chennai?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "You need a valid driving license and an Aadhaar card or government-issued ID. No other documents required.",
        },
      },
      {
        "@type": "Question",
        name: "Are self drive cars available with unlimited km in Chennai?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Most MM Miles cars include unlimited km. Kilometer limits apply only to select premium cars and will be mentioned clearly during booking.",
        },
      },
      {
        "@type": "Question",
        name: "What is the minimum age to rent a car in Chennai?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "The minimum age to rent a self drive car at MM Miles is 18 years with a valid Indian driving license.",
        },
      },
    ],
  };

  // ── Schema: BreadcrumbList ──
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Self Drive Car Rental Chennai",
        item: "https://www.mmmiles.com",
      },
    ],
  };

  return (
    <>
      {/* JSON-LD Schemas */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <main>

        {/* ── SEO H1 (hidden visually, read by Google) ── */}
        <h1 className="seo-hidden">
          Self Drive Car Rental in Chennai | No Deposit, Unlimited KM | MM Miles
        </h1>

        {/* ── Hidden SEO intro block — keep your design, feed Google ── */}
        <section className="seo-hidden">
          <h2>Self Drive Car Rental in Chennai</h2>
          <p>
            MM Miles offers premium self drive car rentals in Chennai including SUVs,
            hatchbacks and sedans for hourly, daily and monthly rental. Zero security
            deposit, unlimited km and home delivery across Anna Nagar, Velachery, OMR,
            T Nagar, Adyar, Porur, Tambaram and all Chennai areas. Whether you need a car
            for office commute, weekend trips or long travel, MM Miles provides affordable
            and flexible rental options.
          </p>

          {/* Car type links */}
          <h3>Explore Self Drive Cars by Type</h3>
          <ul>
            <li><Link href="/cities/chennai/suv">SUV Rental Chennai</Link></li>
            <li><Link href="/cities/chennai/cheap">Budget Car Rental Chennai</Link></li>
            <li><Link href="/cities/chennai/automatic">Automatic Car Rental Chennai</Link></li>
            <li><Link href="/cities/chennai/sedan">Sedan Rental Chennai</Link></li>
            <li><Link href="/cities/chennai/hatchback">Hatchback Rental Chennai</Link></li>
          </ul>

          {/* Top car model links */}
          <h3>Popular Self Drive Cars in Chennai</h3>
          <ul>
            <li><Link href="/rent/toyota-fortuner">Toyota Fortuner Rental Chennai</Link></li>
            <li><Link href="/rent/innova-crysta">Innova Crysta Rental Chennai</Link></li>
            <li><Link href="/rent/tata-harrier">Tata Harrier Rental Chennai</Link></li>
            <li><Link href="/rent/hyundai-creta">Hyundai Creta Rental Chennai</Link></li>
            <li><Link href="/rent/mahindra-xuv700">Mahindra XUV700 Rental Chennai</Link></li>
            <li><Link href="/rent/maruti-fronx">Maruti Fronx Self Drive Chennai</Link></li>
            <li><Link href="/rent/kia-seltos">Kia Seltos Rental Chennai</Link></li>
            <li><Link href="/rent/tata-nexon">Tata Nexon Rental Chennai</Link></li>
            <li><Link href="/rent/hyundai-venue">Hyundai Venue Rental Chennai</Link></li>
            <li><Link href="/rent/maruti-brezza">Maruti Brezza Rental Chennai</Link></li>
          </ul>

          {/* Area links */}
          <h3>Self Drive Car Rental by Area in Chennai</h3>
          <ul>
            <li><Link href="/cities/chennai/anna-nagar">Car Rental Anna Nagar, Chennai</Link></li>
            <li><Link href="/cities/chennai/velachery">Car Rental Velachery, Chennai</Link></li>
            <li><Link href="/cities/chennai/omr">Car Rental OMR, Chennai</Link></li>
            <li><Link href="/cities/chennai/t-nagar">Car Rental T Nagar, Chennai</Link></li>
            <li><Link href="/cities/chennai/adyar">Car Rental Adyar, Chennai</Link></li>
            <li><Link href="/cities/chennai/porur">Car Rental Porur, Chennai</Link></li>
            <li><Link href="/cities/chennai/tambaram">Car Rental Tambaram, Chennai</Link></li>
            <li><Link href="/cities/chennai/nungambakkam">Car Rental Nungambakkam, Chennai</Link></li>
            <li><Link href="/cities/chennai/guindy">Car Rental Guindy, Chennai</Link></li>
            <li><Link href="/cities/chennai/mogappair">Car Rental Mogappair, Chennai</Link></li>
          </ul>

          {/* USP summary */}
          <h3>Why Choose MM Miles for Self Drive Car Rental in Chennai?</h3>
          <ul>
            <li>Zero security deposit — no money blocked</li>
            <li>Unlimited km — drive anywhere in Tamil Nadu</li>
            <li>Home delivery across all Chennai areas</li>
            <li>Fully insured fleet</li>
            <li>24/7 roadside and customer support</li>
            <li>4.5★ rated by 10,000+ customers</li>
            <li>Book online in 2 minutes</li>
          </ul>
        </section>

        {/* ── Your existing visual components — untouched ── */}
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

        {/* ── Bottom SEO links (visible, matches your existing pattern) ── */}
        <section className="seo-hidden">
          <h2>Lowest Self Drive Cars in Chennai</h2>
          <ul>
            <li><Link href="/rent/toyota-fortuner">Toyota Fortuner Rental Chennai</Link></li>
            <li><Link href="/rent/maruti-fronx">Maruti Fronx Self Drive</Link></li>
            <li><Link href="/rent/innova-crysta">Innova Crysta Rental Chennai</Link></li>
            <li><Link href="/rent/tata-harrier">Tata Harrier Rental Chennai</Link></li>
            <li><Link href="/rent/hyundai-venue">Hyundai Venue Rental Chennai</Link></li>
            <li><Link href="/rent/tata-nexon">Tata Nexon Rental Chennai</Link></li>
            <li><Link href="/rent/hyundai-creta">Hyundai Creta Rental Chennai</Link></li>
          </ul>
        </section>

        <FAQSection />

      </main>
    </>
  );
}
