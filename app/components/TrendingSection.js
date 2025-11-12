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
import styles from "./TrendingSection.module.css";

const carData = [
  {
    id: 1,
    name: "Maruthi Suzuki FRONX",
    type: "For Young One",
    deal: "Trending",
    price: 2660,
    features: ["5 Seater", "4.9 rating", "2022 Model", "Petrol", "Vaccinated after every ride"],
    img: "/trendfronx.png",
    link: "/car2",
  },
  {
    id: 2,
    name: "Innova CRYSTA",
    type: "Comfort",
    deal: "Hot Deal",
    price: 2999,
    features: ["7 Seater", "4.5 rating", "2022 Model", "Petrol", "Vaccinated after every ride"],
    img: "/trendcrysta.png",
    link: "/car4",
  },
  {
    id: 3,
    name: "Toyota FORTUNER",
    type: "Compact SUV",
    deal: "Weekend Deal",
    price: 4000,
    features: ["7 Seater", "4.7 rating", "2020 Model", "Diesel", "Vaccinated after every ride"],
    img: "/trendfortuner.png",
    link: "/car7",
  },
  {
    id: 4,
    name: "Maruthi Suzuki SWIFT",
    type: "Budget",
    deal: "Trending",
    price: 1999,
    features: ["5 Seater", "4.2 rating", "2020 Model", "Petrol", "Vaccinated after every ride"],
    img: "/trendswift.png",
    link: "/car3",
  },
  {
    id: 5,
    name: "Maruthi Suzuki BALENO",
    type: "Recommended",
    deal: "Price Drop",
    price: 2699,
    features: ["5 Seater", "4.9 rating", "2025 Model", "Petrol", "Vaccinated after every ride"],
    img: "/trendbaleno.png",
    link: "/car1",
  },
];

export default function TrendingSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredCard, setHoveredCard] = useState(null);
  const intervalRef = useRef(null);
  const scrollRef = useRef(null);

  // clone the data for seamless looping
  const loopedData = [...carData, ...carData.slice(0, 3)]; // add first 3 at the end
  const totalSlides = carData.length;

  const cardWidth = 310 + 29; // match CSS: card width + gap

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

  // Handle looping
  useEffect(() => {
    if (!scrollRef.current) return;
    const current = scrollRef.current;

    if (activeIndex >= totalSlides) {
      // reached cloned section — reset instantly to start
      setTimeout(() => {
        current.scrollTo({ left: 0, behavior: "auto" });
        setActiveIndex(0);
      }, 600);
    } else if (activeIndex < 0) {
      // if moving back from start, jump to end
      current.scrollTo({ left: totalSlides * cardWidth, behavior: "auto" });
      setActiveIndex(totalSlides - 1);
    } else {
      scrollToCard(activeIndex);
    }
  }, [activeIndex, totalSlides, cardWidth, scrollToCard]);

  // Auto slide
  const startAutoSlide = useCallback(() => {
    stopAutoSlide();
    intervalRef.current = setInterval(() => {
      setActiveIndex((prev) => prev + 1);
    }, 3000);
  }, []);

  const stopAutoSlide = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  useEffect(() => {
    startAutoSlide();
    return stopAutoSlide;
  }, [startAutoSlide]);

  // swipe handling
  const touchStartX = useRef(0);
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    stopAutoSlide();
  };
  const handleTouchEnd = (e) => {
    const endX = e.changedTouches[0].clientX;
    const diff = endX - touchStartX.current;
    if (diff > 50) prevSlide();
    else if (diff < -50) nextSlide();
    startAutoSlide();
  };

  return (
    <section className={styles["trendy-section"]}>
      <h2 className={styles["trendy-heading"]}>Drive What’s Trending</h2>
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
                key={i}
                className={styles["trendy-card"]}
                onMouseEnter={() => setHoveredCard(car.id)}
                onMouseLeave={() => setHoveredCard(null)}
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
                    <span className={styles["trendy-price"]}>Rs.{car.price}</span>
                    <span className={styles["trendy-per-day"]}>per day</span>
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
          {carData.map((_, i) => (
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
