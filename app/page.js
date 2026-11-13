import { CityProvider } from "./context/CityContext";
import FleetSection from "./components/FleetSection";
import LandingHero from "./components/landing/LandingHero";
import HowItWorks from "./components/landing/HowItWorks";
import WhyMMMiles from "./components/landing/WhyMMMiles";
import Offers from "./components/landing/Offers";
import RoadTrips from "./components/landing/RoadTrips";
import Testimonials from "./components/landing/Testimonials";
import Faq from "./components/landing/Faq";
import ClosingCta from "./components/landing/ClosingCta";
import ExploreLinks from "./components/landing/ExploreLinks";
import { getFleetSummary, getHomeFaqs } from "@/lib/landing";

// Live "from" prices and fleet links are refreshed hourly
export const revalidate = 3600;

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
export default async function HomePage() {
  const summary = await getFleetSummary("Chennai");
  const faqs = getHomeFaqs(summary);

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
          // Live lowest all-in 1-day price (GST, insurance, fees); omitted if the fleet couldn't be loaded
          ...(summary && {
            priceSpecification: {
              "@type": "PriceSpecification",
              minPrice: String(summary.from),
              priceCurrency: "INR",
              unitText: "DAY",
            },
          }),
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

  // ── Schema: FAQPage — same list as the visible FAQ section ──
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
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
        {/* Hero search and fleet share the selected city and dates */}
        <CityProvider>
          <LandingHero summary={summary} />
          <FleetSection />
        </CityProvider>
        <HowItWorks rates={summary?.rates} />
        <WhyMMMiles />
        <Offers />
        <RoadTrips />
        <Testimonials />
        <Faq faqs={faqs} />
        <ClosingCta />
        <ExploreLinks summary={summary} />
      </main>
    </>
  );
}
