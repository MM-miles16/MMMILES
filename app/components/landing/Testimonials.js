"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import ui from "./ui.module.css";
import styles from "./Testimonials.module.css";

const GOOGLE_REVIEW_URL = "https://g.page/r/Cf04Wx5P5v3vEAE/review";
const AUTO_MS = 4500;

// Customer quotes from the site's existing testimonials, with face-cropped photos in /landing/people.
// A swipeable slider: four cards at a time on wide screens, three on smaller laptops, two on tablets,
// one-and-a-bit on phones.
// It moves on by itself while on screen, and pauses on hover, touch or keyboard focus.
const REVIEWS = [
  {
    name: "Vishal",
    context: "Needed urgent help",
    photo: "vishal",
    text: "Our car broke down suddenly, but I got a replacement vehicle within an hour. Fast response and professional team — truly a lifesaver.",
  },
  {
    name: "Vengat",
    context: "Family road trip",
    photo: "vengat",
    text: "MM Miles made our family road trip smooth from start to finish. The spacious SUV fit all our luggage, and the customer support was 24/7.",
  },
  {
    name: "Fazil",
    context: "Friends' trip, 4 people",
    photo: "fazil",
    text: "The booking was super easy, got a clean, comfortable car for our boys' weekend. Having 24/7 support made the trip stress-free and fun.",
  },
  {
    name: "Raksha",
    context: "Chennai to Bangalore",
    photo: "raksha",
    text: "I drove from Chennai to Bangalore using MM Miles. The car was handled in a good manner, and there were no hidden charges.",
  },
  {
    name: "Ganesh",
    context: "Corporate client",
    photo: "ganesh",
    text: "I often rent for work trips, and MM Miles is the most reliable. The process is seamless and the cars are always in excellent condition.",
  },
  {
    name: "Dayan Khan",
    context: "Frequent traveller",
    photo: "dayan",
    text: "Even during the holiday rush, MM Miles had cars ready on short notice. We appreciated how easy it was to pick up and drop off without delays.",
  },
  {
    name: "Dinesh",
    context: "Daily commuter",
    photo: "dinesh",
    text: "I got stuck in the rain with no transport, and MM Miles helped me get a car. Smooth pickup and great service, even in bad weather.",
  },
  {
    name: "Shivraj",
    context: "Solo traveller",
    photo: "shivraj",
    text: "I booked just a day before my trip and I still got a reliable vehicle. I'm super impressed with MM Miles' quick turnaround and response.",
  },
];

const TONES = [styles.lavender, styles.sky, styles.mist, styles.midnight];

export default function Testimonials() {
  const trackRef = useRef(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // One card's width plus the gap
  const step = () => {
    const track = trackRef.current;
    const card = track?.querySelector("li");
    if (!card) return 0;
    return card.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || "0");
  };

  const slide = (dir) => {
    const track = trackRef.current;
    if (!track) return;
    const end = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
    if (dir > 0 && end) track.scrollTo({ left: 0, behavior: reducedMotion ? "auto" : "smooth" });
    else track.scrollBy({ left: dir * step(), behavior: reducedMotion ? "auto" : "smooth" });
  };

  // Arrow states follow the scroll position
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const update = () => {
      setAtStart(track.scrollLeft <= 4);
      setAtEnd(track.scrollLeft + track.clientWidth >= track.scrollWidth - 4);
    };
    update();
    track.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      track.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Gentle autoplay: only on screen, never while the visitor is interacting
  useEffect(() => {
    if (!inView || paused || reducedMotion) return;
    const t = setInterval(() => slide(1), AUTO_MS);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, paused, reducedMotion]);

  return (
    <section className={`${ui.section} ${styles.section}`} aria-labelledby="reviews-title">
      <div className={ui.container}>
        <div className={`${ui.head} ${styles.head}`}>
          <h2 id="reviews-title" className={ui.title}>
            Loved by people who drive with us
          </h2>
          <p className={ui.lead}>Real trips, in our renters&apos; own words.</p>
        </div>

        <ul
          ref={trackRef}
          className={styles.track}
          aria-label="Customer reviews"
          onPointerEnter={() => setPaused(true)}
          onPointerLeave={(e) => e.pointerType === "mouse" && setPaused(false)}
          onTouchStart={() => setPaused(true)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
        >
          {REVIEWS.map((r, i) => (
            <li key={r.name} className={`${styles.card} ${TONES[i % TONES.length]}`}>
              <Quote size={26} className={styles.quoteIcon} aria-hidden="true" />
              <blockquote className={styles.text}>{r.text}</blockquote>
              <div className={styles.person}>
                <Image src={`/landing/people/${r.photo}.webp`} alt="" width={48} height={48} className={styles.avatar} />
                <div>
                  <p className={styles.name}>{r.name}</p>
                  <p className={styles.context}>{r.context}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className={styles.controls}>
          <a href={GOOGLE_REVIEW_URL} target="_blank" rel="noopener noreferrer" className={styles.google}>
            Write a review on Google
          </a>
          <div className={styles.arrows}>
            <button type="button" className={styles.arrow} onClick={() => slide(-1)} disabled={atStart} aria-label="Previous reviews">
              <ChevronLeft size={20} />
            </button>
            <button type="button" className={styles.arrow} onClick={() => slide(1)} aria-label={atEnd ? "Back to the first review" : "Next reviews"}>
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
