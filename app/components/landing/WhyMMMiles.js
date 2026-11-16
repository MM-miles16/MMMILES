import Image from "next/image";
import { Check } from "lucide-react";
import ui from "./ui.module.css";
import styles from "./WhyMMMiles.module.css";

// text: laptops and up; short: the phone's app-style tiles
const FEATURES = [
  {
    icon: "house",
    tone: styles.sky,
    title: "Doorstep delivery",
    text: "We bring the car to your home or office across Chennai, and collect it when you're done.",
    short: "Home or office, anywhere in Chennai",
  },
  {
    icon: "shield",
    tone: styles.lavender,
    title: "Insurance included",
    text: "Every trip is covered, and the cost is already in the price you see.",
    short: "Every trip covered, already in the price",
  },
  {
    icon: "infinity",
    tone: styles.mint,
    title: "Unlimited km",
    text: "On most cars, so you can head to Pondicherry or Ooty without watching the meter.",
    short: "On most cars, no meter to watch",
  },
  {
    icon: "headphone",
    tone: styles.peach,
    title: "24×7 support",
    text: "Stuck or have a question? Call or WhatsApp us any time during your trip, day or night.",
    short: "Call or WhatsApp, day or night",
  },
];

export default function WhyMMMiles() {
  return (
    <section className={`${ui.section} ${styles.section}`} aria-labelledby="why-title">
      <div className={ui.container}>
        <div className={`${ui.head} ${styles.head}`}>
          <h2 id="why-title" className={ui.title}>
            Self-drive, without the usual hassle
          </h2>
          <p className={ui.lead}>Nothing blocked on your card, no queue at a counter and no worrying about cover.</p>
        </div>

        <div className={styles.grid}>
          <article className={`${styles.card} ${styles.big}`}>
            {/* Top row: the ₹0 figure and its label on the left, the wallet on the right */}
            <div className={styles.bigTop}>
              <p className={styles.stat}>
                <b>₹0</b>
                <span>security deposit</span>
              </p>
              <Image src="/landing/3d/wallet.webp" alt="" width={240} height={240} className={styles.bigArt} />
            </div>
            <h3 className={styles.cardTitle}>Keep your money where it belongs</h3>
            <p className={`${styles.cardText} ${styles.long}`}>
              We never hold a deposit, not at booking and not during the trip. You pay for the rental, and that&apos;s it.
            </p>
            <p className={`${styles.cardText} ${styles.short}`}>Nothing blocked on your card, no cash at handover.</p>
            <ul className={styles.chips}>
              <li>
                <Check aria-hidden="true" /> No amount blocked
              </li>
              <li>
                <Check aria-hidden="true" /> No cash deposit
              </li>
            </ul>
          </article>

          {FEATURES.map((f) => (
            <article key={f.title} className={`${styles.card} ${styles.feature} ${f.tone}`}>
              <span className={styles.iconTile}>
                <Image src={`/landing/3d/${f.icon}.webp`} alt="" width={120} height={120} />
              </span>
              <h3 className={styles.cardTitle}>{f.title}</h3>
              <p className={`${styles.cardText} ${styles.long}`}>{f.text}</p>
              <p className={`${styles.cardText} ${styles.short}`}>{f.short}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
