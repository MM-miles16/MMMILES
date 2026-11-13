import Image from "next/image";
import { Check } from "lucide-react";
import SearchBar from "../SearchBar";
import { formatINR } from "@/lib/landing";
import ui from "./ui.module.css";
import styles from "./LandingHero.module.css";

const TRUST = ["Zero security deposit", "Doorstep delivery & pickup", "Insurance included", "24×7 support"];

// Homepage hero: the H1 Google reads, the booking search front and centre, and live "from" price.
// Must be rendered inside <CityProvider> (SearchBar uses the city context).
export default function LandingHero({ summary }) {
  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <div className={ui.container}>
        <div className={styles.panel}>
          <div className={styles.copy}>
            <p className={styles.kicker}>
              <span className={styles.dot} aria-hidden="true" /> Doorstep delivery across Chennai
            </p>
            <h1 id="hero-title" className={styles.title}>
              Self-drive car rental in Chennai, <span>delivered to your door.</span>
            </h1>
            <p className={styles.lead}>
              Zero deposit, insurance included, and rentals from 6 hours to a month. Choose a car, pick your times and
              we&apos;ll bring it to you.
            </p>
          </div>

          <div className={styles.visual} aria-hidden="true">
            <div className={styles.halo} />
            <Image
              src="/landing/hero-car.webp"
              alt=""
              width={1100}
              height={525}
              priority
              sizes="(max-width: 760px) 92vw, (max-width: 1080px) 46vw, 560px"
              className={styles.car}
            />
            {summary?.from && (
              <div className={`${styles.float} ${styles.floatPrice}`}>
                <span>Cars from</span>
                <strong>
                  {formatINR(summary.from)}
                  <small>/day</small>
                </strong>
                <span className={styles.allIn}>All-in · GST & fees included</span>
              </div>
            )}
            <div className={`${styles.float} ${styles.floatDeposit}`}>
              <span className={styles.floatIcon}>
                <Image src="/landing/3d/wallet.webp" alt="" width={36} height={36} />
              </span>
              <span className={styles.floatText}>
                <strong>Zero deposit</strong>
                <span>Nothing blocked on your card</span>
              </span>
            </div>
          </div>

          <div id="search" className={styles.search}>
            <SearchBar />
          </div>
        </div>

        <ul className={styles.trust}>
          {TRUST.map((t) => (
            <li key={t}>
              <span className={styles.check} aria-hidden="true">
                <Check size={14} strokeWidth={3} />
              </span>
              {t}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
