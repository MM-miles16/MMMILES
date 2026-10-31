import Link from "next/link";

export const dynamic = "force-static";

/* =========================
   SEO METADATA
========================= */
export const metadata = {
  title: "Self Drive Car Rental Chennai | Browse All Cars",
  description:
    "Browse all self drive cars available in Chennai at MM Miles. SUVs, sedans, hatchbacks and automatic cars from ₹799/day. Zero deposit, unlimited km, home delivery. Book in 2 minutes!",
  keywords: [
    "self drive car rental Chennai",
    "rent a car Chennai",
    "car rental in Chennai",
    "self drive cars Chennai",
    "SUV rental Chennai",
    "automatic car rental Chennai",
    "cheap car rental Chennai",
    "car hire Chennai",
  ].join(", "),
  alternates: {
    canonical: "https://www.mmmiles.com/car",
  },
  openGraph: {
    title: "Self Drive Car Rental Chennai | Browse All Cars | MM Miles",
    description:
      "Browse self drive cars in Chennai. SUVs, sedans & hatchbacks from ₹799/day. Zero deposit, unlimited km.",
    url: "https://www.mmmiles.com/car",
    siteName: "MM Miles",
    type: "website",
    locale: "en_IN",
    images: [
      {
        url: "/mmmiles-og.jpg",
        width: 1200,
        height: 630,
        alt: "MM Miles – Self Drive Cars in Chennai",
      },
    ],
  },
};

/* =========================
   DATA
========================= */
const carTypes = [
  { slug: "suv", label: "SUV Rental Chennai" },
  { slug: "automatic", label: "Automatic Car Rental" },
  { slug: "cheap", label: "Budget / Cheap Car Rental" },
  { slug: "sedan", label: "Sedan Rental Chennai" },
  { slug: "hatchback", label: "Hatchback Rental" },
];

// All car slugs — fixed typos from original file
const allCars = [
  { slug: "toyota-fortuner", name: "Toyota Fortuner" },
  { slug: "innova-crysta", name: "Innova Crysta" },
  { slug: "tata-harrier", name: "Tata Harrier" },
  { slug: "tata-nexon", name: "Tata Nexon" },
  { slug: "tata-safari", name: "Tata Safari" },
  { slug: "tata-punch", name: "Tata Punch" },
  { slug: "mahindra-thar", name: "Mahindra Thar" },
  { slug: "mahindra-xuv700", name: "Mahindra XUV700" },
  { slug: "mahindra-scorpio", name: "Mahindra Scorpio" },
  { slug: "mahindra-thar-roxx", name: "Mahindra Thar Roxx" },  // fixed: tharroxx → thar-roxx
  { slug: "hyundai-creta", name: "Hyundai Creta" },
  { slug: "hyundai-i20", name: "Hyundai i20" },
  { slug: "hyundai-venue", name: "Hyundai Venue" },
  { slug: "hyundai-verna", name: "Hyundai Verna" },
  { slug: "maruti-fronx", name: "Maruti Fronx" },
  { slug: "maruti-brezza", name: "Maruti Brezza" },
  { slug: "maruti-baleno", name: "Maruti Suzuki Baleno" },     // fixed: maruthi-suzuki-Baleno → maruti-baleno
  { slug: "maruti-swift", name: "Maruti Swift" },              // fixed: swift → maruti-swift
  { slug: "honda-city", name: "Honda City" },
  { slug: "honda-amaze", name: "Honda Amaze" },
  { slug: "volkswagen-virtus", name: "Volkswagen Virtus" },
  { slug: "skoda-slavia", name: "Skoda Slavia" },
  { slug: "kia-seltos", name: "Kia Seltos" },
  { slug: "kia-sonet", name: "Kia Sonet" },                    // fixed: kie-sonet → kia-sonet
  { slug: "mg-hector", name: "MG Hector" },
  { slug: "toyota-glanza", name: "Toyota Glanza" },
];

const areas = [
  { slug: "anna-nagar", name: "Anna Nagar" },
  { slug: "velachery", name: "Velachery" },
  { slug: "omr", name: "OMR" },
  { slug: "ecr", name: "ECR" },
  { slug: "t-nagar", name: "T Nagar" },
  { slug: "porur", name: "Porur" },
  { slug: "tambaram", name: "Tambaram" },
  { slug: "chromepet", name: "Chromepet" },
  { slug: "adyar", name: "Adyar" },
  { slug: "nungambakkam", name: "Nungambakkam" },
  { slug: "mogappair", name: "Mogappair" },
  { slug: "guindy", name: "Guindy" },
  { slug: "ashok-nagar", name: "Ashok Nagar" },
  { slug: "kk-nagar", name: "KK Nagar" },
  { slug: "madipakkam", name: "Madipakkam" },
];

/* =========================
   PAGE COMPONENT
========================= */
export default function CarsPage() {

  // ── Schema: ItemList of cars ──
  const carListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Self Drive Cars Available in Chennai",
    description: "Browse all self drive rental cars available in Chennai at MM Miles.",
    url: "https://www.mmmiles.com/car",
    numberOfItems: allCars.length,
    itemListElement: allCars.map((car, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: `${car.name} Self Drive Rental Chennai`,
      url: `https://www.mmmiles.com/rent/${car.slug}`,
    })),
  };

  // ── Schema: FAQPage ──
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Is self drive car rental available in Chennai?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. MM Miles offers self drive car rentals across Chennai with zero deposit, unlimited km and home delivery to Anna Nagar, Velachery, OMR, T Nagar, Adyar and all areas.",
        },
      },
      {
        "@type": "Question",
        name: "What documents are required to rent a self drive car in Chennai?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "A valid driving license and an Aadhaar card or government-issued ID are required. No other documents needed.",
        },
      },
      {
        "@type": "Question",
        name: "Is fuel included in the self drive car rental price?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Fuel is not included. Cars are provided with fuel and must be returned with the same fuel level. Any shortage is charged at actuals.",
        },
      },
      {
        "@type": "Question",
        name: "Is insurance included in MM Miles car rental?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. All MM Miles self drive cars are fully insured. Coverage details are shared at the time of booking.",
        },
      },
      {
        "@type": "Question",
        name: "Does MM Miles charge a security deposit for car rental in Chennai?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. MM Miles charges zero security deposit for self drive car rental in Chennai. You only pay the rental fee.",
        },
      },
      {
        "@type": "Question",
        name: "Do you provide 24/7 support for car rentals?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. MM Miles provides 24/7 customer support and roadside assistance across Chennai and outstation.",
        },
      },
    ],
  };

  // ── Schema: BreadcrumbList ──
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.mmmiles.com" },
      { "@type": "ListItem", position: 2, name: "Self Drive Cars Chennai", item: "https://www.mmmiles.com/car" },
    ],
  };

  return (
    <>
      {/* JSON-LD Schemas */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(carListSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <main style={{ padding: "40px 20px", maxWidth: "1200px", margin: "0 auto" }}>

        {/* ── Breadcrumb ── */}
        <nav aria-label="breadcrumb" style={{ fontSize: 13, color: "#888", marginBottom: 16 }}>
          <Link href="/">Home</Link>
          {" "}&rsaquo;{" "}
          <span>Self Drive Cars Chennai</span>
        </nav>

        {/* ── H1 ── */}
        <h1>Self Drive Car Rental in Chennai</h1>

        {/* ── Intro ── */}
        <p style={{ fontSize: 16, color: "#555", marginBottom: 8 }}>
          MM Miles offers trusted and affordable{" "}
          <strong>self drive car rentals in Chennai</strong> starting from ₹799/day.
          Rent hatchbacks, sedans, and SUVs with zero security deposit, unlimited km
          and home delivery across all Chennai areas.
        </p>
        <p style={{ fontSize: 14, color: "#777", marginBottom: 28 }}>
          10,000+ happy customers · 4.5★ rated · Fully insured · 24/7 support ·
          <Link href="/car/chennai"> Browse Chennai-specific rentals →</Link>
        </p>

        {/* ── Car Type Quick Links ── */}
        <section style={{ marginTop: 8, marginBottom: 36 }}>
          <h2>Browse by Car Type</h2>
          <ul style={{ paddingLeft: 20, lineHeight: 2.2 }}>
            {carTypes.map(({ slug, label }) => (
              <li key={slug}>
                <Link href={`/cities/chennai/${slug}`}>{label}</Link>
              </li>
            ))}
          </ul>
        </section>

        {/* ── Services ── */}
        <section style={{ marginBottom: 36 }}>
          <h2>Self Drive Car Rental Services in Chennai</h2>
          <ul style={{ paddingLeft: 20, lineHeight: 2.2 }}>
            <li>Hourly car rental in Chennai — rent by the hour</li>
            <li>Daily self drive car rental in Chennai</li>
            <li>Monthly car rental Chennai — long term plans available</li>
            <li>Airport car rental Chennai — pickup & drop</li>
            <li>Outstation self drive — Pondicherry, Ooty, Kodaikanal, Bangalore</li>
            <li>Corporate car rental Chennai — fleet plans for businesses</li>
          </ul>
        </section>

        {/* ── All Car Models ── */}
        <section style={{ marginBottom: 36 }}>
          <h2>Browse Self Drive Cars by Model</h2>
          <ul style={{ paddingLeft: 20, lineHeight: 2.2, columns: 2 }}>
            {allCars.map(({ slug, name }) => (
              <li key={slug}>
                <Link href={`/rent/${slug}`}>{name} Rental Chennai</Link>
              </li>
            ))}
          </ul>
        </section>

        {/* ── Chennai Area Links ── */}
        <section style={{ marginBottom: 36 }}>
          <h2>Self Drive Car Rental by Area in Chennai</h2>
          <p style={{ fontSize: 14, color: "#555", marginBottom: 10 }}>
            We deliver to your doorstep. Select your area for local availability and pricing:
          </p>
          <ul style={{ paddingLeft: 20, lineHeight: 2.2, columns: 2 }}>
            {areas.map(({ slug, name }) => (
              <li key={slug}>
                <Link href={`/cities/chennai/${slug}`}>Self Drive Cars {name}, Chennai</Link>
              </li>
            ))}
          </ul>
        </section>

        {/* ── Why MM Miles ── */}
        <section style={{ marginBottom: 36 }}>
          <h2>Why Choose MM Miles for Self Drive Car Rental in Chennai?</h2>
          <ul style={{ paddingLeft: 20, lineHeight: 2.2 }}>
            <li><strong>Zero security deposit</strong> — no money blocked at any stage</li>
            <li><strong>Unlimited km</strong> — drive within Chennai or go outstation</li>
            <li><strong>Home delivery</strong> — car delivered to your address in Chennai</li>
            <li><strong>Fully insured fleet</strong> — drive worry-free</li>
            <li><strong>No hidden charges</strong> — transparent pricing always</li>
            <li><strong>24/7 support</strong> — roadside and customer assistance</li>
            <li><strong>10,000+ happy customers</strong> — 4.5★ rated</li>
          </ul>
        </section>

        {/* ── Support Links ── */}
        <section style={{ marginBottom: 36 }}>
          <p style={{ fontSize: 14, color: "#555" }}>
            Learn more <Link href="/about">about MM Miles</Link> ·{" "}
            <Link href="/faq">Car rental FAQs</Link> ·{" "}
            <Link href="/contact">Contact support</Link> ·{" "}
            <Link href="/steps">How booking works</Link> ·{" "}
            <Link href="/insurance">Insurance details</Link>
          </p>
        </section>

        {/* ── FAQ (visible) ── */}
        <section style={{ marginBottom: 36 }}>
          <h2>Frequently Asked Questions — Car Rental in Chennai</h2>
          {[
            {
              q: "Is there a security deposit for car rental in Chennai?",
              a: "No. MM Miles charges zero security deposit. You only pay the rental fee.",
            },
            {
              q: "What documents do I need to rent a self drive car in Chennai?",
              a: "Valid driving license + Aadhaar card or government-issued ID. That's it.",
            },
            {
              q: "Are self drive cars available with unlimited km in Chennai?",
              a: "Yes. All MM Miles self drive cars include unlimited km — drive within Chennai or go outstation.",
            },
            {
              q: "Does MM Miles offer home delivery for car rental in Chennai?",
              a: "Yes. We deliver across all Chennai areas including Anna Nagar, Velachery, OMR, T Nagar, Adyar and more.",
            },
            {
              q: "Is fuel included in the car rental price?",
              a: "Fuel is not included. Cars are provided with fuel and must be returned at the same level.",
            },
          ].map(({ q, a }) => (
            <details
              key={q}
              style={{ marginBottom: 12, borderBottom: "1px solid #eee", paddingBottom: 12 }}
            >
              <summary style={{ fontWeight: 600, cursor: "pointer", lineHeight: 1.6 }}>{q}</summary>
              <p style={{ marginTop: 8, color: "#555", lineHeight: 1.7 }}>{a}</p>
            </details>
          ))}
        </section>

      </main>
    </>
  );
}
