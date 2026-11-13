import Image from "next/image";
import CopyCode from "./CopyCode";
import ui from "./ui.module.css";
import styles from "./Offers.module.css";

// Long-trip rates mirror lib/pricing.js tiers (3–6 days −5%, 7–13 −15%, 14–29 −20%)
const LONG_TRIP = [
  { days: "3–6 days", off: "5%" },
  { days: "7–13 days", off: "15%" },
  { days: "14+ days", off: "20%" },
];

export default function Offers() {
  return (
    <section id="offers" className={ui.section} aria-labelledby="offers-title">
      <div className={ui.container}>
        <div className={ui.head}>
          <p className={ui.eyebrow}>Offers</p>
          <h2 id="offers-title" className={ui.title}>
            Save more on every trip
          </h2>
        </div>

        <div className={styles.grid}>
          <article className={`${styles.card} ${styles.lavender}`}>
            <div className={styles.top}>
              <span className={styles.badge}>New customers</span>
              <Image src="/landing/3d/wrapped-gift.webp" alt="" width={120} height={120} className={styles.art} />
            </div>
            <h3 className={styles.cardTitle}>₹350 off your first booking</h3>
            <p className={styles.cardText}>Apply the code at checkout on your first trip with MM Miles.</p>
            <CopyCode code="FIRSTMILES" />
          </article>

          <article className={`${styles.card} ${styles.sky}`}>
            <div className={styles.top}>
              <span className={styles.badge}>Long trips</span>
              <Image src="/landing/3d/chart-decreasing.webp" alt="" width={120} height={120} className={styles.art} />
            </div>
            <h3 className={styles.cardTitle}>The longer you drive, the less you pay per day</h3>
            <ul className={styles.rates}>
              {LONG_TRIP.map((r) => (
                <li key={r.days}>
                  <span>{r.days}</span>
                  <strong>{r.off} off</strong>
                </li>
              ))}
            </ul>
          </article>

          <article className={`${styles.card} ${styles.mist}`}>
            <div className={styles.top}>
              <span className={styles.badge}>Short trips</span>
              <Image src="/landing/3d/stopwatch.webp" alt="" width={120} height={120} className={styles.art} />
            </div>
            <h3 className={styles.cardTitle}>Rent from just 6 hours</h3>
            <p className={styles.cardText}>
              Need a car for an errand, an airport run or a family function? Book it for the hours you need.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
