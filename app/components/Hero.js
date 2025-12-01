"use client";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import styles from "./Hero.module.css";

const desktopImages = ["/tn-hero.jpg", "/kerala-hero.jpg", "/hero22.png"];
const mobileImages = ["/hero-mobile4.png", "/hero-mobile2.png", "/hero-mobile5.png"]; // <-- your mobile images

export default function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const sliderRef = useRef(null);

  const images = isMobile ? mobileImages : desktopImages;

  // Detect mobile on mount
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Auto slide
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => prev + 1);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const total = images.length;

  // Loop reset without visual jump
  const actualIndex = current % total;

  // ---- MOBILE SWIPE LOGIC ----
  useEffect(() => {
    if (!isMobile) return;

    const slider = sliderRef.current;
    if (!slider) return;

    let startX = 0;
    let endX = 0;

    const handleTouchStart = (e) => {
      startX = e.touches[0].clientX;
    };

    const handleTouchMove = (e) => {
      endX = e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
      const swipeAmt = startX - endX;

      if (Math.abs(swipeAmt) > 50) {
        // left swipe → next
        if (swipeAmt > 0) setCurrent((prev) => prev + 1);
        // right swipe → previous
        else setCurrent((prev) => prev - 1);
      }
    };

    slider.addEventListener("touchstart", handleTouchStart);
    slider.addEventListener("touchmove", handleTouchMove);
    slider.addEventListener("touchend", handleTouchEnd);

    return () => {
      slider.removeEventListener("touchstart", handleTouchStart);
      slider.removeEventListener("touchmove", handleTouchMove);
      slider.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isMobile]);

  return (
    <section className={styles.slider} aria-label="Car hero slider">
      <div
        ref={sliderRef}
        className={styles.slidesWrapper}
        style={{
          transform: `translateX(-${actualIndex * 100}%)`,
        }}
      >
        {images.concat(images[0]).map((src, idx) => (
          <div className={styles.slide} key={idx}>
            <Image
              src={src}
              alt=""
              fill
              aria-hidden="true"
              className={styles.backgroundBlur}
            />
            <Image
              src={src}
              alt={`Hero slide ${idx + 1}`}
              fill
              className={styles.foregroundCar}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
