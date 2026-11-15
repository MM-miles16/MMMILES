import Image from "next/image";
import Link from "next/link";
import { Headphones, ShieldCheck, Wallet } from "lucide-react";
import HostMap from "../HostMap";
import ui from "../ui.module.css";
import styles from "./HostMapStory.module.css";

const FEATURES = [
  [Wallet, "Weekly payouts", "Keep 80% or more, paid to your bank every week"],
  [Headphones, "24/7 host support", "A dedicated team on call or WhatsApp, day or night"],
  [ShieldCheck, "OTP pickup & drop", "Your car changes hands only after the renter shares the OTP"],
];

// Option 3 — Map story: a large solid map is the centrepiece, with a real host's words over the sea;
// the pitch and three feature rows sit beside it. The whole panel is one link.
export default function HostMapStory() {
  return (
    <section className={`${ui.section} ${styles.section}`} aria-labelledby="host-title-story">
      <div className={ui.container}>
        <Link href="/host-registration" className={styles.panel}>
          <span className={styles.intro}>
            <span className={ui.eyebrow}>For car owners</span>
            <h2 id="host-title-story" className={styles.title}>
              Own a car? Let it <span>earn for you</span>
            </h2>
            <span className={styles.lead}>We&apos;re expanding hosting across Chennai, Bengaluru and Hyderabad.</span>
          </span>

          <span className={styles.mapSide}>
            <span className={styles.chip}>Expanding to 3 cities</span>
            <HostMap id="host-map-story" className={styles.map} />
            <span className={styles.bubble}>
              <Image src="/landing/people/host-krunal.webp" alt="" width={96} height={96} className={styles.avatar} />
              <span className={styles.bubbleText}>
                &ldquo;Payments arrive on time, and I always know what&apos;s happening with my car.&rdquo;
                <b>Krunal Iyer, fleet host</b>
              </span>
            </span>
          </span>

          <span className={styles.features}>
            {FEATURES.map(([Icon, title, text]) => (
              <span key={title} className={styles.feature}>
                <span className={styles.icon}>
                  <Icon size={20} strokeWidth={2.1} aria-hidden="true" />
                </span>
                <span className={styles.featureText}>
                  <b>{title}</b>
                  <small>{text}</small>
                </span>
              </span>
            ))}
          </span>

          <span className={`${ui.btn} ${ui.btnDark} ${styles.cta}`}>Become a host</span>
        </Link>
      </div>
    </section>
  );
}
