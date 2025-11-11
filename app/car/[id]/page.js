"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import styles from "./carDetail.module.css";
import Counter from "../../components/Counter";

// --- Static placeholders for now ---
const blurCardsData = [
  { id: 1, title: "Service", subtext: "Showroom record", color: "blue" },
  { id: 2, title: "Display", subtext: "7-inch Smart Display", color: "green" },
  { id: 3, title: "Safety", subtext: "6 Airbags", color: "cyan" },
  { id: 4, title: "Engine", subtext: "TODO: from DB", color: "blue" },
  { id: 5, title: "Clean", subtext: "Cars sanitized before each trip", color: "green" },
  { id: 6, title: "Maintenance", subtext: "Serviced regularly", color: "cyan" },
];

const faqData = [
  { id: 1, question: "What documents are required for pickup?", answer: "TODO: Add FAQ data" },
  { id: 2, question: "How do I cancel my booking?", answer: "TODO: Add cancellation details" },
  { id: 3, question: "What happens in case of damage?", answer: "TODO: Add insurance details" },
  { id: 4, question: "Is fuel included in trip price?", answer: "TODO: Add pricing info" },
];

const exploreCardsData = [
  { id: 1, image: "/explore-cards/card1.png", tag: "SUV", title: "Explore Premium SUVs", description: "Find reliable SUVs for every trip." },
  { id: 2, image: "/explore-cards/card2.png", tag: "Sedan", title: "Luxury Sedans", description: "Comfort and style at affordable rates." },
  { id: 3, image: "/explore-cards/card3.png", tag: "Hatchback", title: "City Drives", description: "Compact and fuel-efficient rides." },
];

const statsData = [
  { number: "2025", label: "Model Year" },
  { number: "12000", label: "Driven (KM)" },
  { number: "18", label: "KM/L Mileage" },
  { number: "5", label: "Seats" },
];

export default function CarPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pickup = searchParams.get("pickup") || searchParams.get("pickupTime");
  const returnTime = searchParams.get("return") || searchParams.get("returnTime");

  const [car, setCar] = useState(null);
  const [host, setHost] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePlan, setActivePlan] = useState("MAX");
  const [currentMainMedia, setCurrentMainMedia] = useState(null);

  useEffect(() => {
    async function fetchCar() {
      try {
        const { data: vehicle, error } = await supabase
          .from("vehicles")
          .select("*, hosts(*)")
          .eq("id", id)
          .single();
        if (error) throw error;

        setCar(vehicle);
        setHost(vehicle.hosts || null);

        const { data: imgs } = await supabase
          .from("vehicle_images")
          .select("*")
          .eq("vehicle_id", id)
          .order("is_primary", { ascending: false });

        setImages(imgs?.length ? imgs : []);
        setCurrentMainMedia(
          imgs?.length
            ? { src: imgs[0].image_url, type: "image" }
            : { src: "/cars/default.jpg", type: "image" }
        );
      } catch (e) {
        console.error("Error fetching car:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchCar();
  }, [id]);

  const handleBookNow = () => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      const redirectUrl = encodeURIComponent(`/car/${id}?pickup=${pickup}&return=${returnTime}`);
      router.push(`/login?redirect=${redirectUrl}`);
      return;
    }
    router.push(`/checkout?car=${id}&pickup=${pickup}&return=${returnTime}`);
  };

  if (loading) return <p className={styles.loading}>Loading...</p>;
  if (!car) return <p className={styles.error}>Car not found</p>;

  const insurancePlans = [
    { name: "MAX", price: 629, description: "Only pay Rs.2000 in case of accidental damage." },
    { name: "PLUS", price: 569, description: "Only pay Rs.7999 in case of accidental damage." },
    { name: "BASIC", price: 469, description: "Only pay Rs.9999 in case of accidental damage." },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.contentWrapper}>
        {/* --- Left Column --- */}
        <div className={styles.leftColumn}>
          <div className={styles.mainImage}>
            <Image
              src={currentMainMedia?.src || "/cars/default.jpg"}
              alt="Main Car"
              fill
              style={{ objectFit: "cover" }}
            />
          </div>

          <div className={styles.thumbnails}>
            {images.map((img, i) => (
              <div
                key={i}
                className={`${styles.thumbnail} ${
                  currentMainMedia?.src === img.image_url ? styles.activeThumbnail : ""
                }`}
                onClick={() => setCurrentMainMedia({ src: img.image_url, type: "image" })}
              >
                <Image src={img.image_url} alt="thumb" fill style={{ objectFit: "cover" }} />
              </div>
            ))}
          </div>
        </div>

        {/* --- Right Column --- */}
        <div className={styles.rightColumn}>
          <h1 className={styles.carName}>
            {car.make} {car.model} ({car.model_year})
          </h1>
          <p className={styles.priceTag}>
            <span className={styles.startingAt}>STARTING AT</span>
            <br />
            <span className={styles.priceValue}>
              ₹{Number(car.hourly_rate).toLocaleString("en-IN")}
            </span>
            <span className={styles.priceUnit}>/hour</span>
          </p>

          <p className={styles.description}>TODO: Add car description from DB.</p>

          <div className={styles.insuranceSection}>
            <p className={styles.travelConfident}>Travel with confidence</p>
            <div className={styles.plansContainer}>
              {insurancePlans.map((plan) => (
                <div
                  key={plan.name}
                  className={`${styles.planBox} ${
                    activePlan === plan.name ? styles.activePlan : ""
                  }`}
                  onClick={() => setActivePlan(plan.name)}
                >
                  <span className={styles.planName}>{plan.name}</span>
                  <p className={styles.planPrice}>₹{plan.price}</p>
                  <p className={styles.planDesc}>{plan.description}</p>
                </div>
              ))}
            </div>
            <Link href="#" className={styles.learnMore}>
              Learn More &gt;
            </Link>
          </div>

          <div className={styles.actionButtons}>
            <button className={styles.bookBtn} onClick={handleBookNow}>
              Book Now
            </button>
          </div>
        </div>
      </div>

      {/* --- Stats Section --- */}
      <div className={styles.statsSection}>
        <div className={styles.statsContainer}>
          {statsData.map((stat, i) => (
            <Counter key={i} value={stat.number} label={stat.label} styles={styles} />
          ))}
        </div>
      </div>

      {/* --- Car Location --- */}
      <div className={styles.locationSection}>
        <div className={styles.worldMapContainer}>
          <Image src="/chennai-map.png" alt="Map" fill className={styles.worldMapImage} />
          <div className={styles.locationTextContent}>
            <h2>
              {car.location_name}, {car.city}
            </h2>
            <p>
              Hosted by <strong>{host?.full_name || "TODO: Host Name"}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* --- Blur Cards --- */}
      <div className={styles.blurCardsSection}>
        <div className={styles.blurHeader}>
          <h3>Key Features of {car.make} {car.model}</h3>
        </div>
        <div className={styles.blurCardsContainer}>
          {blurCardsData.map((card) => (
            <div key={card.id} className={`${styles.blurCard} ${styles[card.color]}`}>
              <h3 className={styles.cardTitle}>{card.title}</h3>
              <p className={styles.cardSubtext}>{card.subtext}</p>
            </div>
          ))}
        </div>
      </div>

      {/* --- FAQ --- */}
      <div className={styles.faqSection}>
        <div className={styles.faqHeader}>
          <h3>Looking for help? Here are our most frequently asked questions</h3>
        </div>
        <div className={styles.faqGrid}>
          {faqData.map((q) => (
            <div key={q.id} className={styles.faqCard}>
              <div className={styles.faqNumber}>{q.id}</div>
              <h4 className={styles.faqQuestion}>{q.question}</h4>
              <p className={styles.faqAnswer}>{q.answer}</p>
            </div>
          ))}
        </div>
      </div>

      {/* --- Explore --- */}
      <div className={styles.exploreSection}>
        <h2 className={styles.exploreTitle}>Explore More Cars</h2>
        <div className={styles.exploreCardsGrid}>
          {exploreCardsData.map((card) => (
            <Link key={card.id} href="#" className={styles.exploreCardLink}>
              <div className={styles.exploreCard}>
                <div className={styles.exploreCardImageWrapper}>
                  <Image src={card.image} alt={card.title} fill className={styles.exploreCardImage} />
                </div>
                <div className={styles.exploreCardContent}>
                  <span className={styles.exploreCardTag}>{card.tag}</span>
                  <h3 className={styles.exploreCardTitle}>{card.title}</h3>
                  <p className={styles.exploreCardDescription}>{card.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
