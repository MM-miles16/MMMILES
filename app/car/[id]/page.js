"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import styles from "./carDetail.module.css";
import Counter from "../../components/Counter";

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
  const [activePlan, setActivePlan] = useState("BASIC");
  const [currentMainMedia, setCurrentMainMedia] = useState(null);

  useEffect(() => {
    async function fetchCar() {
      try {
        const { data: vehicle, error } = await supabase
          .from("vehicles")
          .select("*, hosts(*), vehicle_images(*)")
          .eq("id", id)
          .single();
        if (error) throw error;

        // safely parse features/faqs
        const parsedVehicle = {
          ...vehicle,
          features:
            typeof vehicle.features === "string"
              ? JSON.parse(vehicle.features)
              : vehicle.features || [],
          faqs:
            typeof vehicle.faqs === "string"
              ? JSON.parse(vehicle.faqs)
              : vehicle.faqs || [],
        };

        setCar(parsedVehicle);
        setHost(vehicle.hosts || null);
        setImages(vehicle.vehicle_images || []);
        setCurrentMainMedia(
          vehicle.vehicle_images?.length
            ? { src: vehicle.vehicle_images[0].image_url, type: "image" }
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

  // Pricing tiers from DB
  const pricingPlans = [
    {
      name: "MAX",
      price: car.price_max || 80,
      description: "Long trip — unlimited km.",
    },
    {
      name: "PLUS",
      price: car.price_plus || 70,
      description: `Up to ${car.max_km_plus || 400} km.`,
    },
    {
      name: "BASIC",
      price: car.price_basic || 60,
      description: `Up to ${car.max_km_basic || 200} km.`,
    },
  ];

  // Stats Section (derived from car data)
  const statsData = [
    { number: car.model_year || "N/A", label: "Model Year" },
    { number: car.mileage_kmpl || "N/A", label: "KM/L Mileage" },
    { number: car.seating_capacity || "N/A", label: "Seats" },
    { number: car.hourly_rate || "N/A", label: "Base Rate (₹/hr)" },
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
            <span className={styles.priceValue}>₹{car.price_basic}</span>
            <span className={styles.priceUnit}>/hour</span>
          </p>

          <p className={styles.description}>{car.description || "TODO: Add car description."}</p>

          <div className={styles.insuranceSection}>
            <p className={styles.travelConfident}>Choose Your Plan</p>
            <div className={styles.plansContainer}>
              {pricingPlans.map((plan) => (
                <div
                  key={plan.name}
                  className={`${styles.planBox} ${
                    activePlan === plan.name ? styles.activePlan : ""
                  }`}
                  onClick={() => setActivePlan(plan.name)}
                >
                  <span className={styles.planName}>{plan.name}</span>
                  <p className={styles.planPrice}>₹{plan.price}/hr</p>
                  <p className={styles.planDesc}>{plan.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.actionButtons}>
            <BookNowButton
              carId={id}
              pickup={pickup}
              returnTime={returnTime}
              plan={activePlan}
            />
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

      {/* --- Features --- */}
      <div className={styles.blurCardsSection}>
        <div className={styles.blurHeader}>
          <h3>Key Features of {car.make} {car.model}</h3>
        </div>
        <div className={styles.blurCardsContainer}>
          {(car.features || []).map((f, idx) => (
            <div key={idx} className={`${styles.blurCard} ${styles.blue}`}>
              <h3 className={styles.cardTitle}>{f.feature}</h3>
              <p className={styles.cardSubtext}>{f.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* --- FAQs --- */}
      <div className={styles.faqSection}>
        <div className={styles.faqHeader}>
          <h3>Looking for help? Here are our most frequently asked questions</h3>
        </div>
        <div className={styles.faqGrid}>
          {(car.faqs || []).map((q) => (
            <div key={q.id} className={styles.faqCard}>
              <div className={styles.faqNumber}>{q.id}</div>
              <h4 className={styles.faqQuestion}>{q.question}</h4>
              <p className={styles.faqAnswer}>{q.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BookNowButton({ carId, pickup, returnTime, plan }) {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("auth_token");
      if (!token) return setLoggedIn(false);
      try {
        const payload = JSON.parse(
          atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
        );
        const now = Math.floor(Date.now() / 1000);
        setLoggedIn(payload?.exp && payload.exp > now);
      } catch {
        setLoggedIn(false);
      }
    };

    checkAuth();
    window.addEventListener("auth-change", checkAuth);
    return () => window.removeEventListener("auth-change", checkAuth);
  }, []);

  const handleClick = () => {
    if (!loggedIn) {
      const redirectUrl = encodeURIComponent(`/car/${carId}?pickup=${pickup}&return=${returnTime}`);
      router.push(`/login?redirect=${redirectUrl}`);
      return;
    }

    router.push(`/checkout?car=${carId}&pickup=${pickup}&return=${returnTime}&plan=${plan}`);
  };

  return (
    <button className={styles.bookBtn} onClick={handleClick}>
      {loggedIn ? "Book Now" : "Login to Continue"}
    </button>
  );
}
