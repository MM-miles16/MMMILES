import Image from "next/image";
import Link from "next/link";
import { Headphones, MapPin, ShieldCheck, Wallet } from "lucide-react";
import HostMap from "../HostMap";
import ui from "../ui.module.css";
import styles from "./HostSpotlight.module.css";

const CITIES = [
  ["Chennai", "Tamil Nadu"],
  ["Bengaluru", "Karnataka"],
  ["Hyderabad", "Telangana"],
];

// Option 2 — Host spotlight: a real host's portrait with floating payout / OTP / support badges,
// the pitch beside it, and a compact map card for the three cities. The whole panel is one link.
export default function HostSpotlight() {
  return (
    <section className={`${ui.section} ${styles.section}`} aria-labelledby="host-title-spotlight">
      <div className={ui.container}>
        <Link href="/host-registration" className={styles.panel}>
          <span className={styles.visual}>
            <span className={styles.photoCard}>
              <Image
                src="/landing/people/host-krunal-portrait.webp"
                alt="Krunal Iyer, a host on MM Miles"
                width={640}
                height={800}
                className={styles.photo}
              />
              <span className={styles.nameTag}>
                <b>Krunal Iyer</b>
                <small>Fleet host on MM Miles</small>
              </span>
            </span>

            <span className={`${styles.float} ${styles.fPayout}`}>
              <span className={`${styles.fIcon} ${styles.mint}`}>
                <Wallet size={18} strokeWidth={2.2} aria-hidden="true" />
              </span>
              <span className={styles.fText}>
                <b>Payout sent</b>
                <small>Every week, to your bank</small>
              </span>
            </span>
            <span className={`${styles.float} ${styles.fOtp}`}>
              <span className={`${styles.fIcon} ${styles.sky}`}>
                <ShieldCheck size={18} strokeWidth={2.2} aria-hidden="true" />
              </span>
              <span className={styles.fText}>
                <b>OTP verified</b>
                <small>Pickup and drop</small>
              </span>
            </span>
            <span className={`${styles.float} ${styles.fSupport}`}>
              <Headphones size={16} strokeWidth={2.2} aria-hidden="true" /> 24/7 host support
            </span>
          </span>

          <span className={styles.content}>
            <h2 id="host-title-spotlight" className={styles.title}>
              Own a car? Let it <span>earn for you</span>
            </h2>
            <span className={styles.lead}>
              List your car, keep 80% or more of every booking and get paid every week. Every pickup and drop is
              confirmed with an OTP, and our host team is there 24/7.
            </span>

            <span className={styles.mapCard}>
              <HostMap id="host-map-spotlight" className={styles.map} />
              <span className={styles.mapText}>
                <b>Expanding to 3 cities</b>
                {CITIES.map(([city, state]) => (
                  <span key={city} className={styles.cityRow}>
                    <MapPin size={15} strokeWidth={2.2} aria-hidden="true" />
                    <span>
                      {city}
                      <small>{state}</small>
                    </span>
                  </span>
                ))}
              </span>
            </span>

            <span className={`${ui.btn} ${ui.btnDark} ${styles.cta}`}>Become a host</span>
          </span>
        </Link>
      </div>
    </section>
  );
}
