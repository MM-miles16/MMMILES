import CopyCode from "./CopyCode";
import ui from "./ui.module.css";
import styles from "./Offers.module.css";

// Long-trip rates mirror lib/pricing.js tiers (3–6 days −5%, 7–13 −15%, 14–29 −20%)
const LONG_TRIP = [
  { days: "3–6", off: "5%" },
  { days: "7–13", off: "15%" },
  { days: "14+", off: "20%" },
];

// Ring of text around the badge on the welcome card
function Badge() {
  return (
    <svg className={styles.badge} viewBox="0 0 120 120" aria-hidden="true">
      <defs>
        <path id="offers-ring" d="M60 60 m-47 0 a47 47 0 1 1 94 0 a47 47 0 1 1 -94 0" />
      </defs>
      <circle cx="60" cy="60" r="36" className={styles.badgeDisc} />
      <g className={styles.ring}>
        <text>
          <textPath href="#offers-ring" textLength="292" lengthAdjust="spacing">
            FIRST TRIP — ₹350 OFF — WELCOME OFFER —
          </textPath>
        </text>
      </g>
      {/* Steering wheel */}
      <g className={styles.wheel}>
        <circle cx="60" cy="60" r="21" />
        <path d="M39 61h14M67 61h14M60 67v14" />
        <circle cx="60" cy="61" r="6.5" className={styles.wheelHub} />
      </g>
    </svg>
  );
}

// A 12-hour dial with the first six hours highlighted
function Dial() {
  return (
    <svg className={styles.dial} viewBox="0 0 120 120" aria-hidden="true">
      <defs>
        <linearGradient id="offers-dial" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7cc4f2" />
          <stop offset="1" stopColor="#1f6fb2" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="57" className={styles.dialFace} />
      {Array.from({ length: 12 }, (_, i) => (
        <line
          key={i}
          x1="60"
          y1="9"
          x2="60"
          y2={i % 3 === 0 ? 17 : 14}
          transform={`rotate(${i * 30} 60 60)`}
          className={i % 3 === 0 ? styles.tickMajor : styles.tick}
        />
      ))}
      <circle cx="60" cy="60" r="36" className={styles.arcTrack} />
      <circle
        cx="60"
        cy="60"
        r="36"
        pathLength="100"
        transform="rotate(-90 60 60)"
        stroke="url(#offers-dial)"
        className={styles.arc}
      />
      <line x1="60" y1="60" x2="60" y2="32" className={styles.hand} />
      <circle cx="60" cy="60" r="6" className={styles.hub} />
      <circle cx="60" cy="60" r="2" className={styles.hubDot} />
    </svg>
  );
}

// Three road-trip objects people remember: the welcome code on a number plate, long-trip
// discounts as highway milestones, and the 6-hour minimum on a clock dial.
export default function Offers() {
  return (
    <section id="offers" className={`${ui.section} ${styles.section}`} aria-labelledby="offers-title">
      <div className={ui.container}>
        <div className={`${ui.head} ${styles.head}`}>
          <p className={ui.eyebrow}>Offers</p>
          <h2 id="offers-title" className={ui.title}>
            Save more on every trip
          </h2>
          <p className={ui.lead}>A welcome code for your first trip, and lower daily rates the longer you drive.</p>
        </div>

        <div className={styles.grid}>
          {/* Welcome offer */}
          <article className={`${styles.card} ${styles.hero}`}>
            <Badge />
            <span className={styles.tag}>New customers</span>
            <p className={styles.amount}>
              <b>₹350</b>
              <span>off</span>
            </p>
            <h3 className={styles.heroTitle}>on your first booking</h3>
            <CopyCode code="FIRSTMILES" />
            <p className={styles.fine}>Apply the code at checkout on your first trip with MM Miles.</p>
          </article>

          {/* Long trips */}
          <article className={`${styles.card} ${styles.split} ${styles.long}`}>
            <div className={styles.copy}>
              <span className={styles.tag}>Long trips</span>
              <p className={styles.amountSm}>
                <small>Up to</small>
                <b>20%</b>
                <span>off</span>
              </p>
              <h3 className={styles.title}>The longer you drive, the less you pay per day</h3>
            </div>
            <ol className={styles.stones} aria-label="Long-trip discounts">
              {LONG_TRIP.map((r) => (
                <li key={r.days} className={styles.stone}>
                  <span className={styles.cap}>{r.off}</span>
                  <span className={styles.sr}> off for </span>
                  <span className={styles.stoneBody}>
                    <b>{r.days}</b> days
                  </span>
                </li>
              ))}
            </ol>
          </article>

          {/* Short trips */}
          <article className={`${styles.card} ${styles.split} ${styles.short}`}>
            <div className={styles.copy}>
              <span className={styles.tag}>Short trips</span>
              <p className={styles.amountSm}>
                <b>6 hrs</b>
                <span>minimum</span>
              </p>
              <h3 className={styles.title}>Errands, airport runs, family functions: book only the hours you need</h3>
            </div>
            <Dial />
          </article>
        </div>
      </div>
    </section>
  );
}
