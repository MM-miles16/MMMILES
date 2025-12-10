"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  FaCar,
  FaStar,
  FaGasPump,
  FaShieldVirus,
  FaAward,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import { useCity } from "../context/CityContext";
import styles from "./TrendingSection.module.css";

export default function TrendingSection() {
  const { selectedCity, pickupDateTime, returnDateTime } = useCity();
  
  // State management
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Carousel state
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredCard, setHoveredCard] = useState(null);
  const intervalRef = useRef(null);
  const scrollRef = useRef(null);
  const touchStartX = useRef(0);

  // Supabase storage base URL for car images
  const STORAGE_BASE_URL = "https://tktfsjtlfjxbqfvbcoqr.supabase.co/storage/v1/object/public/car-images/";

  // Helper to get primary image URL
  const getPrimaryImageUrl = (vehicle) => {
    const images = vehicle.vehicle_images || [];
    const primaryImage = images.find((img) => img.is_primary) || images[0];
    if (primaryImage?.image_url) {
      // If already a full URL, return as-is; otherwise prepend base URL
      return primaryImage.image_url.startsWith("http")
        ? primaryImage.image_url
        : `${STORAGE_BASE_URL}${primaryImage.image_url}`;
    }
    return "/default-car.png";
  };

  // Handle car card click with datetime validation
  const handleCarClick = (e) => {
    // Check if both pickup and return datetime are set
    if (!pickupDateTime || !returnDateTime) {
      e.preventDefault();
      toast.error("Please select pickup and return date & time in the search bar above");
      return;
    }
    
    // Update sessionStorage with current search params (same as SearchBar)
    const params = new URLSearchParams({
      city: selectedCity,
      pickupTime: pickupDateTime,
      returnTime: returnDateTime,
    });
    
    sessionStorage.setItem("lastSearchParams", params.toString());
    
    // If datetime is set, navigation will happen naturally via Link
  };

  // Transform vehicle data to match card structure
  const transformedVehicles = vehicles.map((vehicle) => {
    // Build URL with datetime parameters if available
    const urlParams = new URLSearchParams();
    urlParams.set('id', vehicle.id.toString());
    
    if (pickupDateTime) {
      urlParams.set('pickup', pickupDateTime);
    }
    if (returnDateTime) {
      urlParams.set('return', returnDateTime);
    }
    
    const link = `/car/${vehicle.id}${urlParams.toString() ? `?${urlParams.toString()}` : ''}`;
    
    return {
      id: vehicle.id,
      name: `${vehicle.make} ${vehicle.model}`,
      type: vehicle.vehicle_type || "Car",
      deal: "Trending",
      price: vehicle.hourly_rate || 0,
      features: [
        vehicle.seats ? `${vehicle.seats} Seater` : "5 Seater",
        "4.5 rating",
        vehicle.year ? `${vehicle.year} Model` : "2023 Model",
        vehicle.fuel_type || "Petrol",
        "Vaccinated after every ride",
      ],
      img: getPrimaryImageUrl(vehicle),
      link: link,
    };
  });

  // Carousel calculations
  const loopedData = transformedVehicles.length > 0 
    ? [...transformedVehicles, ...transformedVehicles.slice(0, Math.min(3, transformedVehicles.length))]
    : [];
  const totalSlides = transformedVehicles.length;
  const cardWidth = 310 + 29;

  // Carousel callbacks - ALL HOOKS MUST BE AT THE TOP
  const scrollToCard = useCallback(
    (index, smooth = true) => {
      if (!scrollRef.current) return;
      scrollRef.current.scrollTo({
        left: index * cardWidth,
        behavior: smooth ? "smooth" : "auto",
      });
    },
    [cardWidth]
  );

  const nextSlide = useCallback(() => {
    setActiveIndex((prev) => prev + 1);
  }, []);

  const prevSlide = useCallback(() => {
    setActiveIndex((prev) => prev - 1);
  }, []);

  const stopAutoSlide = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const startAutoSlide = useCallback(() => {
    stopAutoSlide();
    if (totalSlides > 0) {
      intervalRef.current = setInterval(() => {
        setActiveIndex((prev) => prev + 1);
      }, 3000);
    }
  }, [totalSlides, stopAutoSlide]);

  const handleTouchStart = useCallback((e) => {
    touchStartX.current = e.touches[0].clientX;
    stopAutoSlide();
  }, [stopAutoSlide]);

  const handleTouchEnd = useCallback((e) => {
    const endX = e.changedTouches[0].clientX;
    const diff = endX - touchStartX.current;
    if (diff > 50) prevSlide();
    else if (diff < -50) nextSlide();
    startAutoSlide();
  }, [prevSlide, nextSlide, startAutoSlide]);

  // Fetch trending vehicles when city changes
  useEffect(() => {
    if (!selectedCity) {
      setVehicles([]);
      return;
    }

    const fetchTrendingVehicles = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/vehicles/trending?city=${encodeURIComponent(selectedCity)}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch trending vehicles");
        }
        
        const data = await response.json();
        setVehicles(data.vehicles || []);
      } catch (err) {
        console.error("Error fetching trending vehicles:", err);
        setError(err.message);
        setVehicles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingVehicles();
  }, [selectedCity]);

  // Handle looping
  useEffect(() => {
    if (!scrollRef.current || totalSlides === 0) return;
    const current = scrollRef.current;

    if (activeIndex >= totalSlides) {
      setTimeout(() => {
        current.scrollTo({ left: 0, behavior: "auto" });
        setActiveIndex(0);
      }, 600);
    } else if (activeIndex < 0) {
      current.scrollTo({ left: totalSlides * cardWidth, behavior: "auto" });
      setActiveIndex(totalSlides - 1);
    } else {
      scrollToCard(activeIndex);
    }
  }, [activeIndex, totalSlides, cardWidth, scrollToCard]);

  // Auto slide
  useEffect(() => {
    if (totalSlides > 0) {
      startAutoSlide();
    }
    return () => stopAutoSlide();
  }, [startAutoSlide, stopAutoSlide, totalSlides]);

  // CONDITIONAL RENDERING - AFTER ALL HOOKS
  
  // Don't render if no city selected
  if (!selectedCity) {
    return null;
  }

  // Loading state
  if (loading) {
    return (
      <section className={styles["trendy-section"]}>
        <h2 className={styles["trendy-heading"]}>Drive What's Trending in {selectedCity}</h2>
        <p className={styles["trendy-subheading"]}>Loading trending cars...</p>
      </section>
    );
  }

  // Error state
  if (error) {
    return (
      <section className={styles["trendy-section"]}>
        <h2 className={styles["trendy-heading"]}>Drive What's Trending in {selectedCity}</h2>
        <p className={styles["trendy-subheading"]}>Unable to load trending cars. Please try again later.</p>
      </section>
    );
  }

  // Empty state
  if (vehicles.length === 0) {
    return (
      <section className={styles["trendy-section"]}>
        <h2 className={styles["trendy-heading"]}>Drive What's Trending in {selectedCity}</h2>
        <p className={styles["trendy-subheading"]}>No trending cars available in {selectedCity} right now.</p>
      </section>
    );
  }

  // Main render with carousel
  return (
    <section className={styles["trendy-section"]}>
      <h2 className={styles["trendy-heading"]}>Drive What's Trending in {selectedCity}</h2>
      <p className={styles["trendy-subheading"]}>Hot Rides, High Demand</p>

      <div
        className={styles["trendy-slider-wrapper"]}
        onMouseEnter={stopAutoSlide}
        onMouseLeave={startAutoSlide}
      >
        {/* Arrows */}
        <button
          className={`${styles["scroll-btn"]} ${styles["left"]}`}
          onClick={prevSlide}
        >
          <FaChevronLeft />
        </button>

        <div
          className={styles["carousel-viewport"]}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className={`${styles["carousel-track"]} ${styles["transition"]}`}
            ref={scrollRef}
            style={{ transform: `translateX(-${activeIndex * cardWidth}px)` }}
          >
            {loopedData.map((car, i) => (
              <Link
                href={car.link}
                key={`${car.id}-${i}`}
                className={styles["trendy-card"]}
                onMouseEnter={() => setHoveredCard(car.id)}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={handleCarClick}
              >
                <div className={styles["trendy-image-wrapper"]}>
                  <Image
                    src={car.img}
                    alt={car.name}
                    width={400}
                    height={240}
                    className={styles["trendy-image"]}
                  />
                </div>

                <div className={styles["trendy-card-content"]}>
                  <div className={styles["trendy-top-row"]}>
                    <span className={styles["trendy-car-type"]}>{car.type}</span>
                    <span className={styles["trendy-deal-tag"]}>{car.deal}</span>
                  </div>

                  <h3 className={styles["trendy-car-name"]}>{car.name}</h3>

                  <div className={styles["trendy-features"]}>
                    <div className={styles["trendy-feature"]}>
                      <FaCar /> {car.features[0]}
                      <span className={styles["trendy-line"]}>
                        <FaStar /> {car.features[1]}
                      </span>
                    </div>
                    <div className={styles["trendy-feature"]}>
                      <FaGasPump /> {car.features[3]}
                      <span className={styles["trendy-line"]}>
                        <FaShieldVirus /> {car.features[4]}
                      </span>
                    </div>
                    <div className={styles["trendy-feature"]}>
                      <FaAward /> {car.features[2]}
                    </div>
                  </div>

                  <div className={styles["trendy-price-row"]}>
                    <span className={styles["trendy-price"]}>₹{car.price}</span>
                    <span className={styles["trendy-per-day"]}>per Hour</span>
                    <button className={styles["trendy-reserve-btn"]}>
                      Book Now
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <button
          className={`${styles["scroll-btn"]} ${styles["right"]}`}
          onClick={nextSlide}
        >
          <FaChevronRight />
        </button>

        {/* Dots */}
        <div className={styles["dot-container"]}>
          {transformedVehicles.map((_, i) => (
            <span
              key={i}
              className={`${styles.dot} ${
                i === (activeIndex % totalSlides) ? styles.activeDot : ""
              }`}
              onClick={() => setActiveIndex(i)}
            ></span>
          ))}
        </div>
      </div>
    </section>
  );
}
