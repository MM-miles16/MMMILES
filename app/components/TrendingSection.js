"use client";
import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  FaCar,
  FaBolt,
  FaInfinity,
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
    features: [
      "5 Seater",
      "4.9 rating",
      "2022 Model",
      "Petrol",
      "Vaccinated after every ride",
    ],
    img: "/trendfronx.png",
    link: "/car2",
  },
  {
    id: 2,
    name: "Innova CRYSTA",
    type: "Comfort",
    deal: "Hot Deal",
    price: 2999,
    features: [
      "7 Seater",
      "4.5 rating",
      "2022 Model",
      "Petrol",
      "Vaccinated after every ride",
    ],
    img: "/trendcrysta.png",
    link: "/car4",
  },
  {
    id: 3,
    name: "Toyota FORTUNER",
    type: "Compact SUV",
    deal: "Weekend Deal",
    price: 4000,
    features: [
      "7 Seater",
      "4.7 rating",
      "2020 Model",
      "Diesel",
      "Vaccinated after every ride",
    ],
    img: "/trendfortuner.png",
    link: "/car7",
  },
  {
    id: 4,
    name: "Maruthi Suzuki SWIFT",
    type: "Budget",
    deal: "Trending",
    price: 1999,
    features: [
      "5 Seater",
      "4.2 rating",
      "2020 Model",
      "Petrol",
      "Vaccinated after every ride",
    ],
    img: "/trendswift.png",
    link: "/car3",
  },
  {
    id: 5,
    name: "Maruthi Suzuki BALENO",
    type: "Recommended",
    deal: "Price Drop",
    price: 2699,
    features: [
      "5 Seater",
      "4.9 rating",
      "2025 Model",
      "Petrol",
      "Vaccinated after every ride",
    ],
    img: "/trendbaleno.png",
    link: "/car1",
  },
];

export default function TrendingSection() {
  const [hoveredCard, setHoveredCard] = useState(null);
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 320; // smooth step
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className={styles["trendy-section"]}>
      <h2 className={styles["trendy-heading"]}>Drive What’s Trending</h2>
      <p className={styles["trendy-subheading"]}>Hot Rides, High Demand</p>

      <div className={styles["trendy-slider-wrapper"]}>
        

        {/* 🚗 Scrollable Track */}
        <div className={styles["trendy-slider-track"]} ref={scrollRef}>
          {carData.map((car) => (
            <Link
              href={car.link}
              key={car.id}
              className={`${styles["trendy-card"]} ${
                hoveredCard === car.id ? styles["trendy-active-card"] : ""
              }`}
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
                  <span className={styles["trendy-price"]}>
                    Rs.{car.price}
                  </span>
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
    </section>
  );
}





