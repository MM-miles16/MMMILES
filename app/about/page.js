import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Building2, CarFront, Check, Clock, Compass, Mail, Phone, Search, Telescope } from "lucide-react";
import { FaInstagram, FaLinkedinIn, FaWhatsapp } from "react-icons/fa";
import { Oswald } from "next/font/google";
import { getActiveCities } from "@/lib/cities";
import ui from "../components/landing/ui.module.css";
import styles from "./about.module.css";

export const metadata = {
  title: "About MM Miles | Self-Drive Car Rental from Chennai",
  description:
    "MM Miles is a self-drive car rental and car hosting platform from Chennai. Zero deposit, doorstep delivery, insurance included and 24×7 support. Our story, values and how to reach us.",
  alternates: {
    canonical: "https://www.mmmiles.com/about",
  },
  openGraph: {
    title: "About MM Miles | Self-Drive Car Rental from Chennai",
    description:
      "Seven years on Chennai's roads: the story, values and people behind MM Miles self-drive car rental.",
    url: "https://www.mmmiles.com/about",
  },
};

const OFFICE_ADDRESS =
  "Plot No: 51, VGN Nagar Phase-4, No: 62, Gurusamy Road, Nolambur, Ambattur Taluk, Tiruvallur District, Chennai 600095, Tamil Nadu";

// Figures already published on this page before the redesign
// "By the numbers" is drawn as a car instrument cluster: three gauges + an odometer.
// p = where the needle sits (0–100); it is decorative, the value/label carry the meaning.
const GAUGES = [
  { id: "years", value: "7", unit: "years", label: "on Chennai's roads", p: 70, accent: "var(--mm-sky)" },
  { id: "deposit", value: "₹0", unit: "deposit", label: "the needle never moves", p: 0, accent: "var(--mm-lavender)" },
  { id: "support", value: "24×7", unit: "", label: "a real person on call", p: 100, accent: "#4ade80" },
];

const ODOMETER = ["2", "0", "0", "0"];

// Dial geometry: centre (100,100), arc radius 80, sweeping left → right over the top
const DIAL_ARC = "M20 100 A80 80 0 0 1 180 100";
const round = (n) => Math.round(n * 100) / 100;
const DIAL_TICKS = Array.from({ length: 11 }, (_, i) => {
  const a = Math.PI - (i / 10) * Math.PI;
  const major = i % 5 === 0;
  const r1 = major ? 52 : 59;
  return {
    major,
    x1: round(100 + r1 * Math.cos(a)),
    y1: round(100 - r1 * Math.sin(a)),
    x2: round(100 + 66 * Math.cos(a)),
    y2: round(100 - 66 * Math.sin(a)),
  };
});

function Gauge({ value, unit, label, p, accent }) {
  return (
    <li style={{ "--accent": accent }}>
      <svg viewBox="0 0 200 110" className={styles.dial} aria-hidden="true">
        {DIAL_TICKS.map((t, i) => (
          <line
            key={i}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            className={t.major ? styles.tickMajor : styles.tick}
          />
        ))}
        <path d={DIAL_ARC} className={styles.dialTrack} />
        <path d={DIAL_ARC} pathLength="100" strokeDasharray={`${p} 100`} className={styles.dialFill} />
        <g transform={`rotate(${round(p * 1.8)} 100 100)`}>
          <line x1="100" y1="100" x2="38" y2="100" className={styles.needle} />
        </g>
        <circle cx="100" cy="100" r="8" className={styles.hub} />
      </svg>
      <p className={styles.gaugeValue}>
        {value}
        {unit && <span>{unit}</span>}
      </p>
      <p className={styles.gaugeLabel}>{label}</p>
    </li>
  );
}

const CHAPTERS = [
  {
    kicker: "Day one",
    title: "It started in Chennai",
    text: "A handful of cars, one phone number and a simple promise: clean cars, honest prices and help whenever you need it.",
    tone: "sky",
    art: "phone",
  },
  {
    kicker: "Doorstep delivery",
    title: "The car comes to you",
    text: "No counters and no queues. We started delivering cars to homes and offices, and collecting them when the trip was done.",
    tone: "lavender",
    art: "delivery",
  },
  {
    kicker: "Car hosting",
    title: "Opened to hosts",
    text: "Car owners can list their cars with us and earn when they are not driving, with no registration or platform fees.",
    tone: "mist",
    art: "garage",
  },
  {
    kicker: "Now",
    title: "Booked in minutes",
    text: "Book online, see the full price before you pay, and rent for anything from 6 hours to 29 days.",
    tone: "midnight",
    art: "booking",
  },
];

// A small car used by the story illustrations (faces right)
function MiniCar({ fill = "#6b57c4" }) {
  return (
    <g>
      <path
        d="M0 22 V16 Q0 12 4 11 L10 10 L16 2 Q18 0 21 0 H34 Q37 0 39 3 L44 10 L48 11 Q52 12 52 16 V22 Q52 24 50 24 H2 Q0 24 0 22 Z"
        fill={fill}
      />
      <path d="M18.5 3 H26 V10 H13.5 Z M29 3 H35.5 Q37 3 38 4.5 L42 10 H29 Z" fill="#eee8fc" />
      <circle cx="11" cy="24" r="5.5" fill="#22222e" />
      <circle cx="11" cy="24" r="2.2" fill="#c5b5ee" />
      <circle cx="41" cy="24" r="5.5" fill="#22222e" />
      <circle cx="41" cy="24" r="2.2" fill="#c5b5ee" />
    </g>
  );
}

const STORY_ART = {
  // one phone number: a phone that rings
  phone: (
    <>
      <g className={styles.saRing}>
        <rect x="72" y="18" width="56" height="112" rx="12" fill="#22222e" />
        <rect x="77" y="28" width="46" height="90" rx="7" fill="#e9f6fe" />
        <rect x="92" y="22" width="16" height="3" rx="1.5" fill="#3b3b4c" />
        <circle cx="100" cy="56" r="12" fill="#c5b5ee" />
        <text x="100" y="60.5" textAnchor="middle" fontSize="11" fontWeight="700" fill="#22222e">
          MM
        </text>
        <rect x="86" y="74" width="28" height="4" rx="2" fill="#22222e" opacity="0.7" />
        <rect x="90" y="82" width="20" height="3" rx="1.5" fill="#22222e" opacity="0.35" />
        <rect x="83" y="100" width="34" height="11" rx="5.5" fill="#22c55e" />
        <path d="M95 105.5 h10" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
      </g>
      <g fill="none" stroke="#6b57c4" strokeWidth="4" strokeLinecap="round">
        <path d="M140 46 Q148 56 140 66" className={styles.saWave} />
        <path d="M150 38 Q164 56 150 74" className={`${styles.saWave} ${styles.saWave2}`} />
        <path d="M60 46 Q52 56 60 66" className={styles.saWave} />
        <path d="M50 38 Q36 56 50 74" className={`${styles.saWave} ${styles.saWave2}`} />
      </g>
    </>
  ),

  // doorstep delivery: the car drives up to a house
  delivery: (
    <>
      <rect x="0" y="118" width="200" height="4" rx="2" fill="rgba(34,34,46,0.15)" />
      <g>
        <polygon points="120,62 154,36 188,62" fill="#22222e" />
        <rect x="126" y="60" width="56" height="58" rx="3" fill="#ffffff" />
        <rect x="134" y="74" width="16" height="14" rx="2" fill="#c3e5fa" />
        <rect x="158" y="84" width="16" height="34" rx="2" fill="#6b57c4" />
      </g>
      <g className={styles.saDrive}>
        <g transform="translate(58 92)">
          <MiniCar fill="#22222e" />
        </g>
        <g stroke="#6b57c4" strokeWidth="3" strokeLinecap="round" className={styles.saSpeed}>
          <line x1="34" y1="98" x2="48" y2="98" />
          <line x1="40" y1="108" x2="52" y2="108" />
        </g>
      </g>
    </>
  ),

  // hosts: the garage door rolls up and the car starts earning
  garage: (
    <>
      <defs>
        <clipPath id="saGarageClip">
          <rect x="52" y="54" width="96" height="66" />
        </clipPath>
      </defs>
      <polygon points="38,56 100,20 162,56" fill="#22222e" strokeLinejoin="round" />
      <rect x="44" y="52" width="112" height="72" rx="4" fill="#ffffff" stroke="#22222e" strokeWidth="3" />
      <rect x="52" y="54" width="96" height="66" fill="#e7e2f7" />
      <g transform="translate(74 92)">
        <MiniCar />
      </g>
      <g clipPath="url(#saGarageClip)">
        <g className={styles.saDoor}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <rect key={i} x="52" y={54 + i * 11} width="96" height="10" fill="#c5b5ee" />
          ))}
        </g>
      </g>
      <g className={styles.saCoin}>
        <circle cx="100" cy="36" r="12" fill="#ffd166" stroke="#e08e0b" strokeWidth="2" />
        <text x="100" y="41" textAnchor="middle" fontSize="14" fontWeight="700" fill="#a85f09">
          ₹
        </text>
      </g>
    </>
  ),

  // today: dates fill in, the price shows, the button turns into "Booked"
  booking: (
    <>
      <rect x="62" y="10" width="76" height="132" rx="14" fill="#ffffff" />
      <rect x="70" y="22" width="60" height="10" rx="3" fill="#c5b5ee" />
      <g className={styles.saField}>
        <rect x="70" y="40" width="28" height="18" rx="5" fill="#eee8fc" />
      </g>
      <g className={`${styles.saField} ${styles.saField2}`}>
        <rect x="102" y="40" width="28" height="18" rx="5" fill="#eee8fc" />
      </g>
      <rect x="70" y="66" width="60" height="4" rx="2" fill="#dcdce4" />
      <rect x="70" y="76" width="44" height="4" rx="2" fill="#dcdce4" />
      <g className={styles.saPrice}>
        <rect x="70" y="88" width="34" height="8" rx="3" fill="#22222e" />
      </g>
      <rect x="70" y="112" width="60" height="18" rx="9" fill="#22222e" />
      <g className={styles.saBooked}>
        <rect x="70" y="112" width="60" height="18" rx="9" fill="#22c55e" />
        <path d="M93 121 L98 126 L108 116" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </>
  ),
};

const VALUES = [
  {
    icon: "wallet",
    tone: "sky",
    title: "Nothing held back",
    text: "We never block a security deposit — not at booking, not at handover.",
  },
  {
    icon: "sparkles",
    tone: "lavender",
    title: "Cars you'd lend family",
    text: "Clean, well-kept cars, ready to drive the moment you open the door.",
  },
  {
    icon: "headphone",
    tone: "mist",
    title: "Humans, not hold music",
    text: "Call or WhatsApp us any time, day or night, before or during your trip.",
  },
  {
    icon: "stopwatch",
    tone: "mist",
    title: "Your trip, your clock",
    text: "Six hours for an airport run or a month for a move — you pick the times.",
  },
];

const TRIPS = [
  { name: "ECR drive", img: "ecr" },
  { name: "Mahabalipuram", img: "mahabalipuram" },
  { name: "Pondicherry", img: "pondicherry" },
  { name: "Yercaud", img: "yercaud" },
  { name: "Kodaikanal", img: "kodaikanal" },
  { name: "Ooty", img: "ooty" },
];

const FACES = ["dinesh", "bhavya", "fazil", "ganesh", "vengat"];

// Official UN SDG colours; text is how MM Miles contributes to each goal
const SDGS = [
  {
    no: 3,
    name: "Good health and well-being",
    color: "#4c9f38",
    title: "Healthy journeys",
    line: "Clean, insured cars",
  },
  {
    no: 8,
    name: "Decent work and economic growth",
    color: "#a21942",
    title: "Fair earnings",
    line: "Idle cars earn",
  },
  {
    no: 9,
    name: "Industry, innovation and infrastructure",
    color: "#fd6925",
    title: "Digital first",
    line: "Book fully online",
  },
  {
    no: 11,
    name: "Sustainable cities and communities",
    color: "#fd9d24",
    title: "Lighter cities",
    line: "Fewer parked cars",
  },
  {
    no: 13,
    name: "Climate action",
    color: "#3f7e44",
    title: "Climate action",
    line: "Fewer cars built",
  },
];

// Condensed face for the goal tiles, close to the official SDG icon lettering
const oswald = Oswald({ subsets: ["latin"], weight: ["500", "600"], display: "swap" });

// Isometric cube outline for the goal 9 pictogram
function cube(cx, cy, s) {
  const w = round(s * 0.87);
  const h = round(s / 2);
  return (
    <g key={`${cx}-${cy}`}>
      <polygon points={`${cx},${cy - s} ${cx + w},${cy - h} ${cx + w},${cy + h} ${cx},${cy + s} ${cx - w},${cy + h} ${cx - w},${cy - h}`} />
      <polyline points={`${cx - w},${cy - h} ${cx},${cy} ${cx + w},${cy - h}`} />
      <line x1={cx} y1={cy} x2={cx} y2={cy + s} />
    </g>
  );
}

// Grid of window cut-outs for the goal 11 pictogram
function windows(x, y, cols, rows, gapX = 6, gapY = 8) {
  const out = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      out.push(<rect key={`${x}-${y}-${r}-${c}`} x={x + c * gapX} y={y + r * gapY} width="3.4" height="4.6" />);
    }
  }
  return out;
}

// Vector pictograms (viewBox 0 0 100 64) — crisp at any size
const SDG_PICTOGRAMS = {
  3: (
    <>
      <polyline points="4,36 28,36 35,22 44,54 55,8 64,34" className={styles.picLine} />
      <path
        d="M80 50 C66 41 64 30 71 26.5 C75.5 24.2 79 26.5 80 29.5 C81 26.5 84.5 24.2 89 26.5 C96 30 94 41 80 50 Z"
        className={styles.picFill}
      />
    </>
  ),
  8: (
    <>
      <rect x="24" y="42" width="14" height="22" className={styles.picFill} />
      <rect x="42" y="34" width="14" height="30" className={styles.picFill} />
      <rect x="60" y="24" width="14" height="40" className={styles.picFill} />
      <polyline points="14,36 34,17 50,29 72,8" className={styles.picStroke} />
      <polygon points="63,7 80,1 76,18" className={styles.picFill} />
    </>
  ),
  9: <g className={styles.picStroke}>{[cube(50, 17, 15), cube(37, 40, 15), cube(63, 40, 15)]}</g>,
  11: (
    <>
      <polygon points="6,46 18,35 30,46 30,64 6,64" className={styles.picFill} />
      <rect x="15" y="53" width="6" height="11" className={styles.picCut} />
      <rect x="35" y="2" width="20" height="62" className={styles.picFill} />
      <g className={styles.picCut}>{windows(38.5, 7, 3, 7)}</g>
      <polygon points="59,64 59,24 76,14 76,64" className={styles.picFill} />
      <g className={styles.picCut}>{windows(62, 26, 2, 5, 7, 7.6)}</g>
      <rect x="80" y="38" width="16" height="26" className={styles.picFill} />
      <g className={styles.picCut}>{windows(83, 42, 2, 3, 6.4, 7)}</g>
    </>
  ),
  13: (
    <>
      <path d="M4 32 C24 4 76 4 96 32 C76 60 24 60 4 32 Z" className={styles.picStroke} />
      <circle cx="50" cy="32" r="16" className={styles.picFill} />
      <path
        d="M41 26 C44 21 52 20 55 24 C52 26 54 30 50 32 C46 34 47 39 43 39 C39 37 38 30 41 26 Z M57 34 C60 33 63 36 61 40 C58 42 55 39 57 34 Z"
        className={styles.picCut}
      />
    </>
  ),
};

// Animated value-card icons, drawn in SVG; motion lives in about.module.css (vi* classes)
const SPARKLE = "M0 -8 C1 -2 2 -1 8 0 C2 1 1 2 0 8 C-1 2 -2 1 -8 0 C-2 -1 -1 -2 0 -8 Z";

const VALUE_ICONS = {
  // a ₹ coin pops out of the wallet and drops back in — nothing is kept
  wallet: (
    <>
      <defs>
        <linearGradient id="viWallet" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffab4f" />
          <stop offset="1" stopColor="#ee7419" />
        </linearGradient>
        <linearGradient id="viCoin" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffe08a" />
          <stop offset="1" stopColor="#f5a524" />
        </linearGradient>
      </defs>
      <rect x="9" y="22" width="46" height="32" rx="8" fill="#c95f12" />
      <rect x="15" y="15" width="30" height="15" rx="3" fill="#5cc98a" transform="rotate(-7 30 22)" />
      <rect x="20" y="13" width="28" height="15" rx="3" fill="#7fdba6" transform="rotate(5 34 20)" />
      <g className={styles.viCoin}>
        <circle cx="32" cy="18" r="9" fill="url(#viCoin)" stroke="#e08e0b" strokeWidth="1.6" />
        <text x="32" y="22" textAnchor="middle" fontSize="11" fontWeight="700" fill="#a85f09">
          ₹
        </text>
      </g>
      <rect x="8" y="27" width="48" height="29" rx="8" fill="url(#viWallet)" />
      <path d="M14 33 H40" stroke="rgba(255,255,255,0.45)" strokeWidth="2" strokeLinecap="round" />
      <rect x="39" y="35" width="20" height="14" rx="6" fill="#d9620f" />
      <rect x="44" y="39.5" width="6" height="5" rx="2.5" fill="#ffd166" />
    </>
  ),

  // a clean car with sparkles twinkling around it
  sparkles: (
    <>
      <defs>
        <linearGradient id="viCar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8a75e0" />
          <stop offset="1" stopColor="#5a46b3" />
        </linearGradient>
      </defs>
      <g className={styles.viCarBody}>
        <path
          d="M8 46 V40 Q8 36 12 35 L18 34 L24 26 Q26 24 29 24 H42 Q45 24 47 27 L52 34 L56 35 Q60 36 60 40 V46 Q60 48 58 48 H10 Q8 48 8 46 Z"
          fill="url(#viCar)"
        />
        <path d="M26.5 27 H34 V34 H21.5 Z" fill="#eee8fc" />
        <path d="M37 27 H43.5 Q45 27 46 28.5 L50 34 H37 Z" fill="#eee8fc" />
        <path d="M12 39 H56" stroke="rgba(255,255,255,0.35)" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="19" cy="48" r="5.6" fill="#22222e" />
        <circle cx="19" cy="48" r="2.2" fill="#c5b5ee" />
        <circle cx="49" cy="48" r="5.6" fill="#22222e" />
        <circle cx="49" cy="48" r="2.2" fill="#c5b5ee" />
      </g>
      <g transform="translate(13 14)">
        <path d={SPARKLE} fill="#ffc94d" className={styles.viSpark} />
      </g>
      <g transform="translate(51 11) scale(0.75)">
        <path d={SPARKLE} fill="#ffffff" className={`${styles.viSpark} ${styles.viSpark2}`} />
      </g>
      <g transform="translate(58 26) scale(0.5)">
        <path d={SPARKLE} fill="#ffc94d" className={`${styles.viSpark} ${styles.viSpark3}`} />
      </g>
    </>
  ),

  // a headset with a speech bubble whose bars move like someone talking
  headphone: (
    <>
      <path d="M13 38 V33 A19 19 0 0 1 51 33 V38" fill="none" stroke="#22222e" strokeWidth="4.5" strokeLinecap="round" />
      <rect x="8" y="33" width="12" height="19" rx="5.5" fill="#6b57c4" />
      <rect x="44" y="33" width="12" height="19" rx="5.5" fill="#6b57c4" />
      <rect x="10.5" y="36" width="3" height="12" rx="1.5" fill="rgba(255,255,255,0.35)" />
      <path d="M14 51 Q15 59 27 59" fill="none" stroke="#22222e" strokeWidth="3" strokeLinecap="round" />
      <rect x="26" y="55.5" width="9" height="6.5" rx="3.2" fill="#22222e" />
      <g className={styles.viBubble}>
        <path d="M36 4 H58 Q62 4 62 8 V18 Q62 22 58 22 H46 L41 26 L42 22 H36 Q32 22 32 18 V8 Q32 4 36 4 Z" fill="#ffffff" />
        <rect x="39" y="9" width="3.4" height="8" rx="1.7" fill="#6b57c4" className={styles.viBar} />
        <rect x="45.3" y="9" width="3.4" height="8" rx="1.7" fill="#6b57c4" className={`${styles.viBar} ${styles.viBar2}`} />
        <rect x="51.6" y="9" width="3.4" height="8" rx="1.7" fill="#6b57c4" className={`${styles.viBar} ${styles.viBar3}`} />
      </g>
    </>
  ),

  // a stopwatch: the hand sweeps while a ring fills, the button clicks each lap
  stopwatch: (
    <>
      <rect x="27" y="4" width="10" height="6" rx="2.5" fill="#22222e" />
      <rect x="30" y="9" width="4" height="6" fill="#22222e" />
      <g className={styles.viButton}>
        <rect x="47" y="12" width="7" height="5" rx="1.6" fill="#22222e" transform="rotate(45 50.5 14.5)" />
      </g>
      <circle cx="32" cy="37" r="22" fill="#ffffff" stroke="#22222e" strokeWidth="4" />
      <circle cx="32" cy="37" r="15" fill="none" stroke="#eee8fc" strokeWidth="5" />
      <circle
        cx="32"
        cy="37"
        r="15"
        fill="none"
        stroke="#6b57c4"
        strokeWidth="5"
        strokeLinecap="round"
        pathLength="100"
        strokeDasharray="100"
        transform="rotate(-90 32 37)"
        className={styles.viRing}
      />
      <g className={styles.viHand}>
        <line x1="32" y1="37" x2="32" y2="23" stroke="#e5484d" strokeWidth="2.8" strokeLinecap="round" />
      </g>
      <circle cx="32" cy="37" r="3" fill="#22222e" />
    </>
  ),
};

function ValueIcon({ name, className }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true" overflow="visible">
      {VALUE_ICONS[name]}
    </svg>
  );
}

// Big card: a receipt whose lines print one by one, then a check draws itself
function ReceiptIcon({ className }) {
  return (
    <svg viewBox="0 0 96 96" className={className} aria-hidden="true" overflow="visible">
      <path
        d="M22 8 H70 Q74 8 74 12 V82 L68 77 L62 82 L56 77 L50 82 L44 77 L38 82 L32 77 L26 82 L20 77 L18 79 V12 Q18 8 22 8 Z"
        fill="#ffffff"
      />
      {[20, 30, 40, 50].map((y, i) => (
        <g key={y} className={styles.viRow} style={{ "--row": i }}>
          <line x1="26" y1={y} x2={i % 2 ? 44 : 50} y2={y} stroke="#c5b5ee" strokeWidth="4" strokeLinecap="round" />
          <line x1="58" y1={y} x2="66" y2={y} stroke="#9a9aab" strokeWidth="4" strokeLinecap="round" />
        </g>
      ))}
      <line x1="26" y1="60" x2="66" y2="60" stroke="#dcdce4" strokeWidth="2" strokeDasharray="3 3" />
      <g className={styles.viRow} style={{ "--row": 4 }}>
        <line x1="26" y1="68" x2="40" y2="68" stroke="#22222e" strokeWidth="5" strokeLinecap="round" />
        <line x1="52" y1="68" x2="66" y2="68" stroke="#6b57c4" strokeWidth="5" strokeLinecap="round" />
      </g>
      <g className={styles.viBadge}>
        <circle cx="72" cy="74" r="15" fill="#22c55e" stroke="#22222e" strokeWidth="4" />
        <path
          d="M65 74 L70 79 L79 69"
          fill="none"
          stroke="#ffffff"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength="100"
          className={styles.viCheck}
        />
      </g>
    </svg>
  );
}

// Boxy off-roader (Thar-style), drawn in SVG and animated in CSS:
// wheels spin, the body bounces on its suspension, road dashes and speed lines stream past.
function OffRoader({ className }) {
  const wheel = (cx) => (
    <g className={styles.suvWheel}>
      <circle cx={cx} cy="86" r="20" fill="#1b1b24" />
      <circle cx={cx} cy="86" r="17.5" fill="none" stroke="#34344a" strokeWidth="3" strokeDasharray="4 3" />
      <circle cx={cx} cy="86" r="11" fill="#c9c9d6" />
      {[0, 72, 144, 216, 288].map((a) => (
        <line
          key={a}
          x1={cx}
          y1="86"
          x2={round(cx + 9.5 * Math.cos((a * Math.PI) / 180))}
          y2={round(86 + 9.5 * Math.sin((a * Math.PI) / 180))}
          stroke="#7d7d8f"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
      ))}
      <circle cx={cx} cy="86" r="3.6" fill="#55556a" />
    </g>
  );

  return (
    <svg viewBox="0 0 204 118" className={`${styles.suv} ${className || ""}`} aria-hidden="true">
      <defs>
        <linearGradient id="suvPaint" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff6a5c" />
          <stop offset="1" stopColor="#c8322b" />
        </linearGradient>
        <linearGradient id="suvGlass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d5efff" />
          <stop offset="1" stopColor="#7cc3ee" />
        </linearGradient>
        <linearGradient id="suvBeam" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffeaa6" stopOpacity="0.7" />
          <stop offset="1" stopColor="#ffeaa6" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* road: shadow + dashes streaming backwards */}
      <ellipse cx="102" cy="107" rx="86" ry="4.5" fill="rgba(0,0,0,0.4)" />
      <line x1="0" y1="114" x2="204" y2="114" className={styles.suvRoad} />

      {/* speed lines behind the car */}
      <g className={styles.suvSpeed}>
        <line x1="0" y1="36" x2="12" y2="36" />
        <line x1="2" y1="56" x2="10" y2="56" />
        <line x1="0" y1="70" x2="14" y2="70" />
      </g>

      <g className={styles.suvBody}>
        {/* headlamp beam */}
        <polygon points="182,54 204,46 204,68" fill="url(#suvBeam)" />
        {/* spare wheel on the tailgate */}
        <rect x="12" y="44" width="13" height="32" rx="5.5" fill="#1d1d26" />
        <rect x="15.5" y="50" width="6" height="20" rx="3" fill="#3b3b4c" />
        {/* lower body */}
        <path d="M24 84 V46 H150 L174 49 Q182 50 182 58 V84 Z" fill="url(#suvPaint)" />
        {/* hard top */}
        <path d="M26 46 V28 Q26 21 33 21 H133 Q139 21 141 26 L149 46 Z" fill="#2b2b38" />
        <path d="M33 21 H133" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" />
        {/* windows */}
        <rect x="33" y="27" width="37" height="15" rx="3" fill="url(#suvGlass)" />
        <path d="M77 27 H132 Q135 27 136.5 30 L141.5 42 H77 Z" fill="url(#suvGlass)" />
        <path d="M84 29 L80 40" stroke="rgba(255,255,255,0.6)" strokeWidth="2.5" strokeLinecap="round" />
        {/* side mirror */}
        <path d="M141 38 H149 V45 H143 Z" fill="#2b2b38" />
        {/* beltline shine + door seams + handles */}
        <path d="M26 51 H149" stroke="rgba(255,255,255,0.35)" strokeWidth="1.6" />
        <path d="M75 47 V79 M118 47 V79" stroke="rgba(0,0,0,0.2)" strokeWidth="1.3" />
        <rect x="80" y="55" width="10" height="2.8" rx="1.4" fill="rgba(0,0,0,0.35)" />
        <rect x="123" y="55" width="10" height="2.8" rx="1.4" fill="rgba(0,0,0,0.35)" />
        {/* lamps */}
        <circle cx="178" cy="58" r="4.6" fill="#fff4cc" stroke="#2b2b38" strokeWidth="1.6" />
        <rect x="24" y="50" width="3.2" height="10" rx="1.2" fill="#ffb347" />
        {/* bumpers + rocker cladding */}
        <rect x="175" y="74" width="13" height="8" rx="2" fill="#1d1d26" />
        <rect x="18" y="74" width="10" height="8" rx="2" fill="#1d1d26" />
        <rect x="78" y="79" width="48" height="6" rx="2" fill="#1d1d26" />
        {/* wheel wells + chunky fender flares */}
        <path d="M26 86 A26 26 0 0 1 78 86 Z" fill="#14141c" />
        <path d="M126 86 A26 26 0 0 1 178 86 Z" fill="#14141c" />
        <path d="M25 86 A27 27 0 0 1 79 86" fill="none" stroke="#1d1d26" strokeWidth="7" />
        <path d="M125 86 A27 27 0 0 1 179 86" fill="none" stroke="#1d1d26" strokeWidth="7" />
      </g>

      {wheel(52)}
      {wheel(152)}
    </svg>
  );
}

// Goal positions around the hub (% of the stage), starting at 12 o'clock
const ORBIT = [-90, -18, 54, 126, 198].map((deg) => ({
  x: round(50 + 38 * Math.cos((deg * Math.PI) / 180)),
  y: round(50 + 38 * Math.sin((deg * Math.PI) / 180)),
}));

function SdgTile({ no, name }) {
  return (
    <div className={`${styles.sdgTile} ${oswald.className}`} aria-hidden="true">
      <div className={styles.sdgHead}>
        <span className={styles.sdgNum}>{no}</span>
        <span className={styles.sdgTitle}>{name}</span>
      </div>
      <svg viewBox="0 0 100 64" className={styles.sdgPic}>
        {SDG_PICTOGRAMS[no]}
      </svg>
    </div>
  );
}

// One source of truth for the business details: the visible card and the schema both read from here,
// so Google sees the same name, address, phone and hours as visitors (and as the home page schema).
const BUSINESS = {
  name: "MM Miles",
  phone: "+918050953607",
  phoneDisplay: "+91 80509 53607",
  whatsapp: "https://wa.me/918050953607",
  email: "support@mmmiles.com",
  street: "Plot No: 51, VGN Nagar Phase-4, No: 62, Gurusamy Road, Nolambur",
  locality: "Chennai",
  region: "Tamil Nadu",
  postalCode: "600095",
  mapsListing: "https://maps.app.goo.gl/gpGgbDxqfo2RMTCG7",
  instagram: "https://www.instagram.com/mmmiles_official",
  linkedin: "https://www.linkedin.com/company/mm-miles/",
};

const DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(OFFICE_ADDRESS)}`;

function aboutSchema(cities) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "AboutPage",
        "@id": "https://www.mmmiles.com/about#webpage",
        url: "https://www.mmmiles.com/about",
        name: "About MM Miles",
        description: metadata.description,
        about: { "@id": "https://www.mmmiles.com/#localbusiness" },
        mainEntity: { "@id": "https://www.mmmiles.com/#localbusiness" },
        breadcrumb: { "@id": "https://www.mmmiles.com/about#breadcrumb" },
      },
      {
        // same @id as the home page LocalBusiness, so Google treats them as one business
        "@type": "AutoRental",
        "@id": "https://www.mmmiles.com/#localbusiness",
        name: BUSINESS.name,
        url: "https://www.mmmiles.com",
        logo: "https://www.mmmiles.com/brand/logo-midnight.webp",
        image: "https://www.mmmiles.com/landing/hero-car.webp",
        telephone: BUSINESS.phone,
        email: BUSINESS.email,
        address: {
          "@type": "PostalAddress",
          streetAddress: BUSINESS.street,
          addressLocality: BUSINESS.locality,
          addressRegion: BUSINESS.region,
          postalCode: BUSINESS.postalCode,
          addressCountry: "IN",
        },
        hasMap: BUSINESS.mapsListing,
        openingHoursSpecification: {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
          opens: "00:00",
          closes: "23:59",
        },
        areaServed: cities.map((name) => ({ "@type": "City", name })),
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer service",
          telephone: BUSINESS.phone,
          email: BUSINESS.email,
          areaServed: "IN",
          availableLanguage: ["English", "Tamil"],
          hoursAvailable: {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
            opens: "00:00",
            closes: "23:59",
          },
        },
        sameAs: [BUSINESS.instagram, BUSINESS.linkedin],
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://www.mmmiles.com/about#breadcrumb",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://www.mmmiles.com" },
          { "@type": "ListItem", position: 2, name: "About", item: "https://www.mmmiles.com/about" },
        ],
      },
    ],
  };
}

export default function AboutPage() {
  const cities = getActiveCities().map((c) => c.name);

  return (
    <main className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutSchema(cities)).replace(/</g, "\\u003c") }}
      />
      {/* ───────── Hero ───────── */}
      <section className={styles.hero} aria-labelledby="about-title">
        <div className={`${ui.container} ${styles.heroGrid}`}>
          <div className={styles.heroCopy}>
            <p className={ui.eyebrow}>About MM Miles</p>
            <h1 id="about-title" className={styles.heroTitle}>
              Self-drive, the way it <span>always should have been.</span>
            </h1>
            <p className={styles.heroLead}>
              MM Miles is a self-drive car rental and car hosting platform from Chennai. For seven years we have
              worked on one idea: renting a car should feel as easy and honest as borrowing one from a friend — no
              deposit, no surprises on the bill, and a real person on the phone when you need one.
            </p>
            <div className={styles.heroActions}>
              <Link href="/#search" className={`${ui.btn} ${ui.btnDark}`}>
                <Search size={18} aria-hidden="true" /> Find a car
              </Link>
              <Link href="/host-registration" className={`${ui.btn} ${styles.btnOutline}`}>
                Become a host <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </div>
            <ul className={styles.cities} aria-label="Cities we serve">
              {cities.map((name) => (
                <li key={name}>
                  {name}
                </li>
              ))}
            </ul>
          </div>

          {/* Visual: a tilted "self-drive pass" ticket on a pastel map, a midnight card peeking behind */}
          <div className={styles.heroVisual} aria-hidden="true">
            <div className={styles.passBack}>
              <Image src="/landing/3d/spiral-calendar.webp" alt="" width={44} height={44} priority />
              <span className={styles.passBackText}>
                <strong>7 years</strong>
                <span>on Chennai&apos;s roads</span>
              </span>
            </div>

            <Image
              src="/landing/3d/sparkles.webp"
              alt=""
              width={64}
              height={64}
              priority
              className={styles.heroSpark}
            />

            <div className={styles.pass}>
              <div className={styles.passHead}>
                <span className={styles.passBrand}>MM Miles · Self-drive pass</span>
                <span className={styles.passStatus}>
                  Confirmed
                </span>
              </div>

              <div className={styles.route}>
                <div>
                  <small>Pickup</small>
                  <strong>Chennai</strong>
                  <span>At your doorstep</span>
                </div>
                <div className={styles.routeLine}>
                  <Image
                    src="/landing/3d/automobile.webp"
                    alt=""
                    width={48}
                    height={48}
                    priority
                    className={styles.routeCar}
                  />
                </div>
                <div className={styles.routeEnd}>
                  <small>Heading to</small>
                  <strong>Pondicherry</strong>
                  <span>Via ECR</span>
                </div>
              </div>

              <div className={styles.perf} />

              <dl className={styles.passFacts}>
                <div className={styles.passFactHot}>
                  <dt>Deposit</dt>
                  <dd>₹0</dd>
                </div>
                <div>
                  <dt>Delivery</dt>
                  <dd>To your door</dd>
                </div>
                <div>
                  <dt>Price</dt>
                  <dd>Shown upfront</dd>
                </div>
                <div>
                  <dt>Help</dt>
                  <dd>24×7</dd>
                </div>
              </dl>

              <div className={styles.passFoot}>
                <span className={styles.barcode} />
                <Image src="/landing/3d/key.webp" alt="" width={56} height={56} priority className={styles.passKey} />
              </div>
            </div>

            <div className={`${styles.chip} ${styles.chipPeople}`}>
              <span className={styles.faces}>
                {FACES.map((f) => (
                  <Image key={f} src={`/landing/people/${f}.webp`} alt="" width={36} height={36} />
                ))}
              </span>
              <span className={styles.chipText}>
                <strong>2,000+ journeys</strong>
                <span>and counting</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── Stats ───────── */}
      <section className={styles.statsSection} aria-label="MM Miles in numbers">
        <div className={ui.container}>
          <div className={styles.cluster}>
            <p className={styles.clusterHead} aria-hidden="true">
              MM Miles · by the numbers
            </p>
            <ul className={styles.gauges}>
              <Gauge {...GAUGES[0]} />

              <li className={styles.odo}>
                <span className={styles.odoTag} aria-hidden="true">
                  ODO
                </span>
                <p className={styles.odoDigits} aria-label="2,000+">
                  {ODOMETER.map((d, i) => (
                    <span key={i} className={styles.odoDigit} aria-hidden="true">
                      {d}
                    </span>
                  ))}
                  <span className={`${styles.odoDigit} ${styles.odoPlus}`} aria-hidden="true">
                    +
                  </span>
                </p>
                <p className={styles.odoLabel}>
                  journeys of trust <span>— and counting</span>
                </p>
              </li>

              {GAUGES.slice(1).map((g) => (
                <Gauge key={g.id} {...g} />
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ───────── Story: a deck of chapter cards that stack as you scroll ───────── */}
      <section className={ui.section} aria-labelledby="story-title">
        <div className={ui.container}>
          <div className={ui.head}>
            <p className={ui.eyebrow}>Our story</p>
            <h2 id="story-title" className={ui.title}>
              The road so far
            </h2>
            <p className={`${ui.lead} ${styles.headLead}`}>
              We built the rental we wanted ourselves: no deposits blocked for weeks, no hidden costs, no paperwork.
            </p>
          </div>

          <ol className={styles.deck}>
            {CHAPTERS.map((c, i) => (
              <li key={c.title} className={`${styles.chapterCard} ${styles[c.tone]}`} style={{ "--i": i }}>
                <div className={styles.chapterCopy}>
                  <span className={styles.chapterNum} aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className={styles.chapterKicker}>{c.kicker}</p>
                  <h3 className={styles.chapterTitle}>{c.title}</h3>
                  <p className={styles.chapterText}>{c.text}</p>
                </div>
                <div className={styles.chapterArt} aria-hidden="true">
                  <svg viewBox="0 0 200 150">{STORY_ART[c.art]}</svg>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ───────── Values ───────── */}
      <section className={`${ui.section} ${styles.valuesSection}`} aria-labelledby="values-title">
        <div className={ui.container}>
          <div className={ui.head}>
            <p className={ui.eyebrow}>What we believe</p>
            <h2 id="values-title" className={ui.title}>
              Five promises behind every booking
            </h2>
            <p className={`${ui.lead} ${styles.headLead}`}>
              What you can count on every time you book with MM Miles, from the first search to handing back the keys.
            </p>
          </div>

          <div className={styles.bento}>
            <article className={`${styles.value} ${styles.valueBig}`}>
              <ReceiptIcon className={styles.valueBigArt} />
              <p className={styles.valueKicker}>Promise one</p>
              <h3 className={styles.valueBigTitle}>The price you see is the price you pay</h3>
              <p className={styles.valueBigText}>
                Before you pay, you see every line — rental, trip protection, convenience fee and GST. No add-ons
                waiting at the handover.
              </p>
              <ul className={styles.checks}>
                {["Full breakdown before payment", "GST and fees shown upfront", "No deposit to chase later"].map(
                  (t) => (
                    <li key={t}>
                      <Check size={14} strokeWidth={3} aria-hidden="true" /> {t}
                    </li>
                  )
                )}
              </ul>
            </article>

            {VALUES.map((v) => (
              <article key={v.title} className={`${styles.value} ${styles[v.tone]}`}>
                <ValueIcon name={v.icon} className={styles.valueArt} />
                <h3 className={styles.valueTitle}>{v.title}</h3>
                <p className={styles.valueText}>{v.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Where people go ───────── */}
      <section className={ui.section} aria-labelledby="trips-title">
        <div className={ui.container}>
          <div className={ui.head}>
            <p className={ui.eyebrow}>Where our renters go</p>
            <h2 id="trips-title" className={ui.title}>
              Roads worth taking
            </h2>
            <p className={`${ui.lead} ${styles.headLead}`}>
              From the coast road to the hill stations, a self-drive car turns a free weekend into a trip to remember.
            </p>
          </div>

          <ul className={styles.trips}>
            {TRIPS.map((t) => (
              <li key={t.name} className={styles.trip}>
                <Image
                  src={`/landing/trips/${t.img}.webp`}
                  alt={`${t.name}, a popular self-drive trip from Chennai`}
                  fill
                  sizes="(max-width: 760px) 60vw, (max-width: 1080px) 33vw, 200px"
                  className={styles.tripImg}
                />
                <span className={styles.tripName}>{t.name}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ───────── Mission & vision: two light tiles joined by the infinity badge ───────── */}
      <section className={`${ui.section} ${styles.purposeSection}`} aria-labelledby="purpose-title">
        <div className={ui.container}>
          <div className={ui.head}>
            <p className={ui.eyebrow}>Why we exist</p>
            <h2 id="purpose-title" className={ui.title}>
              Built around freedom
            </h2>
            <p className={`${ui.lead} ${styles.headLead}`}>
              Two ideas guide every booking we take, every car we hand over and every host who joins us.
            </p>
          </div>

          <div className={styles.purposeGrid}>
            <article className={`${styles.purposeTile} ${styles.purposeMission}`}>
              <p className={styles.purposeTag}>
                <span className={styles.purposeTagIcon} aria-hidden="true">
                  <Compass size={15} />
                </span>
                Our mission
              </p>
              <h3 className={styles.purposeQuote}>
                Give every traveller the <mark>freedom to explore</mark>, with comfort, confidence and care.
              </h3>
              <p className={styles.purposeText}>
                Every drive should become a memory that lasts long after the engine stops.
              </p>
              <span className={styles.purposeMark} aria-hidden="true">
                01
              </span>
            </article>

            <div className={styles.purposeBadge} aria-hidden="true">
              <Image src="/landing/3d/infinity.webp" alt="" width={56} height={56} />
            </div>

            <article className={`${styles.purposeTile} ${styles.purposeVision}`}>
              <p className={styles.purposeTag}>
                <span className={styles.purposeTagIcon} aria-hidden="true">
                  <Telescope size={15} />
                </span>
                Our vision
              </p>
              <h3 className={styles.purposeQuote}>
                A future where self-drive means <mark>total freedom</mark>, and we set the standard for it.
              </h3>
              <p className={styles.purposeText}>
                New benchmarks in reliability, efficiency and service, one trip at a time.
              </p>
              <span className={styles.purposeMark} aria-hidden="true">
                02
              </span>
            </article>
          </div>
        </div>
      </section>

      {/* ───────── Responsibility: five goals orbiting one shared car ───────── */}
      <section className={`${ui.section} ${styles.sdgSection}`} aria-labelledby="sdg-title">
        <div className={ui.container}>
          <div className={ui.head}>
            <p className={ui.eyebrow}>Driving responsibly</p>
            <h2 id="sdg-title" className={ui.title}>
              Five global goals
            </h2>
            <p className={`${ui.lead} ${styles.headLead}`}>
              Sharing cars means fewer cars sitting idle and fewer people needing to buy one. Here is where we line up.
            </p>
          </div>

          {/* Hub = the shared car; the five goals sit around it, lit one after another */}
          <div className={styles.orbit}>
            <svg className={styles.orbitLines} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              {SDGS.map((g, i) => (
                <line
                  key={g.no}
                  x1="50"
                  y1="50"
                  x2={ORBIT[i].x}
                  y2={ORBIT[i].y}
                  className={styles.orbitLine}
                  style={{ "--goal": g.color, "--i": i }}
                />
              ))}
            </svg>

            <div className={styles.hub} aria-hidden="true">
              <OffRoader className={styles.hubCar} />
              <span className={styles.hubText}>One shared car</span>
            </div>

            <ol className={styles.nodes}>
              {SDGS.map((g, i) => (
                <li
                  key={g.no}
                  className={styles.node}
                  style={{ "--goal": g.color, "--i": i, "--x": `${ORBIT[i].x}%`, "--y": `${ORBIT[i].y}%` }}
                >
                  <SdgTile no={g.no} name={g.name} />
                  <div className={styles.nodeText}>
                    <h3 className={styles.nodeTitle}>
                      {g.title}
                      <span className={styles.srOnly}>
                        {" "}
                        (UN Goal {g.no}: {g.name})
                      </span>
                    </h3>
                    <p className={styles.nodeLine}>{g.line}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ───────── Contact: one business card with every detail + where to find us on Google ───────── */}
      <section className={`${ui.section} ${styles.contactSection}`} aria-labelledby="contact-title">
        <div className={ui.container}>
          <div className={ui.head}>
            <h2 id="contact-title" className={ui.title}>
              Talk to a human
            </h2>
            <p className={`${ui.lead} ${styles.headLead}`}>
              Questions before you book, or help in the middle of a trip — a real person replies, day or night.
            </p>
          </div>

          <div className={styles.contactGrid}>
            {/* Business card: every detail in one place, all real links */}
            <article className={styles.bizCard} aria-labelledby="biz-name">
              <header className={styles.bizHead}>
                <Image src="/brand/logo-white.webp" alt="" width={124} height={32} className={styles.bizLogo} />
                <h3 id="biz-name" className={styles.srOnly}>
                  {BUSINESS.name} contact details
                </h3>
                <span className={styles.bizTag}>Self-drive car rental and hosting</span>
              </header>

              <dl className={styles.bizList}>
                <div className={styles.bizRow}>
                  <dt>
                    <span className={styles.bizIcon} aria-hidden="true">
                      <Phone size={18} />
                    </span>
                    Phone
                  </dt>
                  <dd>
                    <a href={`tel:${BUSINESS.phone}`} className={styles.bizValue}>
                      {BUSINESS.phoneDisplay}
                    </a>
                    <span className={styles.bizNote}>Calls and WhatsApp, any time</span>
                  </dd>
                </div>
                <div className={styles.bizRow}>
                  <dt>
                    <span className={styles.bizIcon} aria-hidden="true">
                      <Mail size={18} />
                    </span>
                    Email
                  </dt>
                  <dd>
                    <a href={`mailto:${BUSINESS.email}`} className={styles.bizValue}>
                      {BUSINESS.email}
                    </a>
                    <span className={styles.bizNote}>Bookings, bills and documents</span>
                  </dd>
                </div>
                <div className={styles.bizRow}>
                  <dt>
                    <span className={styles.bizIcon} aria-hidden="true">
                      <Building2 size={18} />
                    </span>
                    Office
                  </dt>
                  <dd>
                    <address className={styles.bizAddress}>{OFFICE_ADDRESS}</address>
                  </dd>
                </div>
                <div className={styles.bizRow}>
                  <dt>
                    <span className={styles.bizIcon} aria-hidden="true">
                      <Clock size={18} />
                    </span>
                    Hours
                  </dt>
                  <dd>
                    <span className={styles.bizValue}>Open 24 hours</span>
                    <span className={styles.bizNote}>Monday to Sunday</span>
                  </dd>
                </div>
                <div className={styles.bizRow}>
                  <dt>
                    <span className={styles.bizIcon} aria-hidden="true">
                      <CarFront size={18} />
                    </span>
                    Cities
                  </dt>
                  <dd>
                    <span className={styles.bizValue}>{cities.join(", ")}</span>
                  </dd>
                </div>
              </dl>

              <div className={styles.bizActions}>
                <a href={`tel:${BUSINESS.phone}`} className={`${ui.btn} ${ui.btnLight}`}>
                  <Phone size={18} aria-hidden="true" /> Call now
                </a>
                <a
                  href={BUSINESS.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${ui.btn} ${styles.btnWhatsapp}`}
                >
                  <FaWhatsapp size={18} aria-hidden="true" /> WhatsApp
                </a>
              </div>
            </article>

            {/* Find us: the Google Maps listing + official profiles */}
            <div className={styles.findCol}>
              <article className={styles.findCard} aria-labelledby="find-title">
                <div className={styles.officeMap} aria-hidden="true">
                  <span className={styles.mapLabel}>Nolambur, Chennai 600095</span>
                </div>
                <div className={styles.findBody}>
                  <h3 id="find-title" className={styles.findTitle}>
                    Find us on Google Maps
                  </h3>
                  <p className={styles.findText}>See our corporate office on Google and get directions.</p>
                  <div className={styles.findActions}>
                    <a
                      href={BUSINESS.mapsListing}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${ui.btn} ${ui.btnDark}`}
                    >
                      View on Google Maps <ArrowUpRight size={18} aria-hidden="true" />
                    </a>
                    <a
                      href={DIRECTIONS_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${ui.btn} ${styles.btnOutline}`}
                    >
                      Get directions
                    </a>
                  </div>
                </div>
              </article>

              <article className={styles.socialCard} aria-labelledby="social-title">
                <h3 id="social-title" className={styles.socialTitle}>
                  Official profiles
                </h3>
                <div className={styles.socialLinks}>
                  <a href={BUSINESS.instagram} target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                    <FaInstagram size={18} aria-hidden="true" /> Instagram
                  </a>
                  <a href={BUSINESS.linkedin} target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                    <FaLinkedinIn size={18} aria-hidden="true" /> LinkedIn
                  </a>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
