"use client";

// City picker — opened from the "City" field of the home search bar.
// One centred pop-up: title, a "use my current location" button, "or pick a city", then Bengaluru,
// Chennai and Hyderabad as cards with line-drawn landmarks. Laptops get a wider pop-up with large
// cards (state + "Select" line); phones get compact icon cards.
// Motion: the pop-up pops in, the landmarks draw themselves in, the location arrow turns now and
// then like a compass, and a landmark comes alive on hover/focus (or once, on phones).
// Reduced motion keeps everything still.

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, Check, Navigation, X } from "lucide-react";
import { isBookableCity } from "@/lib/cities";
import styles from "./CitySelector.module.css";

// Landmark line art on a 64 × 64 grid. `lines` draw in order; `live` is the part that moves.
const ART = {
  Chennai: {
    // temple gopuram
    lines: [
      "M10 54H54",
      "M18 54V44H46V54",
      "M20 44L22.5 35H41.5L44 44",
      "M23.5 35L25.5 27H38.5L40.5 35",
      "M26.5 27L28 20H36L37.5 27",
      "M27 20Q32 12 37 20",
      "M29 54V49Q32 45.5 35 49V54",
      "M22 39.5H42M25 31H39",
    ],
    live: ["M32 13V6", "M32 6.5L38 8.5L32 10.5"],
  },
  Bengaluru: {
    // Vidhana Soudha
    lines: [
      "M8 54H56",
      "M12 54V39H52V54",
      "M18 54V43M24 54V43M30 54V43M34 54V43M40 54V43M46 54V43",
      "M10 39H54",
      "M22 39L32 33L42 39",
      "M26 33V28H38V33",
      "M25 28Q32 15 39 28",
    ],
    live: ["M32 19V10", "M32 10.5L38 12.5L32 14.5"],
  },
  Hyderabad: {
    // Charminar
    lines: [
      "M8 54H56",
      "M13 54V20M19 54V20M45 54V20M51 54V20",
      "M12 30H20M12 40H20M44 30H52M44 40H52",
      "M19 31H45M19 36H45",
      "M24 54V45Q32 35 40 45V54",
      "M27.5 31Q32 24 36.5 31",
    ],
    live: ["M13 20Q16 13 19 20M45 20Q48 13 51 20", "M16 13.5V9M48 13.5V9"],
  },
};

// The three cities in the picker, in the order shown. Hyderabad isn't bookable yet (see BOOKABLE_CITIES
// in lib/cities), so it carries a "Soon" tag and opens the coming-soon page.
const CITIES = [
  { name: "Bengaluru", state: "Karnataka", tone: "sky" },
  { name: "Chennai", state: "Tamil Nadu", tone: "lavender" },
  { name: "Hyderabad", state: "Telangana", tone: "amber" },
].map((c) => ({ ...c, soon: !isBookableCity(c.name) }));

function CityArt({ name }) {
  const art = ART[name];
  let i = 0;
  return (
    <svg className={`${styles.art} ${styles[`m${name}`] ?? ""}`} viewBox="0 0 64 64" aria-hidden="true">
      {art.lines.map((d) => (
        <path key={d} d={d} pathLength="100" style={{ "--i": i++ }} />
      ))}
      <g className={styles.live}>
        {art.live.map((d) => (
          <path key={d} d={d} pathLength="100" style={{ "--i": i++ }} />
        ))}
      </g>
    </svg>
  );
}

export default function CitySelector({ isOpen, onClose, onSelect, selectedCity, onDetect }) {
  const [mounted, setMounted] = useState(false);
  const dialogRef = useRef(null);

  useEffect(() => setMounted(true), []);

  // Lock the page behind, close on Escape, and move keyboard focus into the pop-up
  useEffect(() => {
    if (!isOpen || !mounted) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    dialogRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, mounted, onClose]);

  if (!mounted || !isOpen) return null;

  const pick = (name) => {
    onSelect(name);
    onClose();
  };

  // Hand over to the search bar's GPS lookup; it shows its own progress and picks the city
  const detect = () => {
    onClose();
    onDetect?.();
  };

  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div
        ref={dialogRef}
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby="city-picker-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.head}>
          <h2 id="city-picker-title" className={styles.title}>
            Choose your city
          </h2>
          <p className={styles.sub}>Self-drive cars, delivered to your door</p>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>

        {onDetect && (
          <button type="button" className={styles.detect} onClick={detect}>
            <span className={styles.detectIcon} aria-hidden="true">
              <Navigation size={16} />
            </span>
            Use my current location
          </button>
        )}

        <p className={styles.or}>{onDetect ? "or pick a city" : "Pick a city"}</p>

        <ul className={styles.grid}>
          {CITIES.map((c, n) => {
            const current = selectedCity === c.name;
            return (
              <li key={c.name} style={{ "--n": n }}>
                <button
                  type="button"
                  className={`${styles.city} ${styles[c.tone]} ${c.soon ? styles.isSoon : ""} ${current ? styles.current : ""}`}
                  onClick={() => pick(c.name)}
                  aria-pressed={current}
                  aria-label={`${c.name}${c.soon ? ", coming soon" : ""}`}
                >
                  <span className={styles.tile} aria-hidden="true">
                    <span className={styles.halo} />
                    <CityArt name={c.name} />
                  </span>
                  <span className={styles.name}>{c.name}</span>
                  <span className={styles.state}>{c.state}</span>
                  <span className={styles.status} aria-hidden="true">
                    {c.soon ? (
                      "Coming soon"
                    ) : (
                      <>
                        Select <ArrowRight size={14} />
                      </>
                    )}
                  </span>
                  {c.soon && <span className={styles.soon}>Soon</span>}
                  {current && (
                    <span className={styles.tick} aria-hidden="true">
                      <Check size={10} strokeWidth={3} />
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        <p className={styles.note}>More cities coming soon.</p>
      </div>
    </div>,
    document.body
  );
}
