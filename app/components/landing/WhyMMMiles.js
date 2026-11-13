import Image from "next/image";
import ui from "./ui.module.css";
import styles from "./WhyMMMiles.module.css";

const FEATURES = [
  {
    icon: "delivery-truck",
    tone: styles.sky,
    title: "Doorstep delivery",
    text: "We bring the car to your home or office across Chennai, and collect it when you're done.",
  },
  {
    icon: "shield",
    tone: styles.lavender,
    title: "Insurance included",
    text: "Every trip is covered, and the cost is already in the price you see.",
  },
  {
    icon: "infinity",
    tone: styles.mist,
    title: "Unlimited km on most cars",
    text: "Head to Pondicherry or Ooty without watching the meter. Any limit is shown before you book.",
  },
  {
    icon: "headphone",
    tone: styles.mist,
    title: "24×7 support",
    text: "Call or WhatsApp us any time during your trip, day or night.",
  },
];

export default function WhyMMMiles() {
  return (
    <section className={ui.section} aria-labelledby="why-title">
      <div className={ui.container}>
        <div className={ui.head}>
          <p className={ui.eyebrow}>Why MM Miles</p>
          <h2 id="why-title" className={ui.title}>
            Self-drive, without the usual hassle
          </h2>
          <p className={ui.lead}>Nothing blocked on your card, no queue at a counter and no worrying about cover.</p>
        </div>

        <div className={styles.grid}>
          <article className={`${styles.card} ${styles.big}`}>
            <Image src="/landing/3d/wallet.webp" alt="" width={240} height={240} className={styles.bigArt} />
            <p className={styles.stat}>
              ₹0 <span>security deposit</span>
            </p>
            <h3 className={styles.cardTitle}>Keep your money where it belongs</h3>
            <p className={styles.cardText}>
              We never hold a deposit, not at booking and not during the trip. You pay for the rental, and that&apos;s it.
            </p>
            <ul className={styles.chips}>
              <li>Nothing blocked on your card</li>
              <li>No cash deposit at handover</li>
            </ul>
          </article>

          {FEATURES.map((f) => (
            <article key={f.title} className={`${styles.card} ${f.tone}`}>
              <Image src={`/landing/3d/${f.icon}.webp`} alt="" width={120} height={120} className={styles.art} />
              <h3 className={styles.cardTitle}>{f.title}</h3>
              <p className={styles.cardText}>{f.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
