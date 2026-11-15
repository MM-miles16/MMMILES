import Image from "next/image";
import Link from "next/link";
import { BadgePercent, Headphones, ShieldCheck, Wallet } from "lucide-react";
import HostMap from "../HostMap";
import ui from "../ui.module.css";
import styles from "./HostDark.module.css";

const TILES = [
  [Wallet, "Weekly payouts", "Paid to your bank every week"],
  [BadgePercent, "Keep 80%+", "Commission capped at 20%"],
  [Headphones, "24/7 host support", "Call or WhatsApp, day or night"],
  [ShieldCheck, "OTP pickup & drop", "Handover only after the OTP"],
];

// Option 4 — Midnight: a dark panel with a glowing map of the three cities, four glass feature
// tiles and a host's words beside the button. The whole panel is one link.
export default function HostDark() {
  return (
    <section className={`${ui.section} ${styles.section}`} aria-labelledby="host-title-dark">
      <div className={ui.container}>
        <Link href="/host-registration" className={styles.panel}>
          <span className={styles.intro}>
            <span className={`${ui.eyebrow} ${styles.eyebrow}`}>For car owners</span>
            <h2 id="host-title-dark" className={styles.title}>
              Own a car? Let it <span>earn for you</span>
            </h2>
            <span className={styles.lead}>We&apos;re expanding hosting across Chennai, Bengaluru and Hyderabad.</span>
          </span>

          <span className={styles.mapSide}>
            <HostMap id="host-map-dark" tone="dark" className={styles.map} />
          </span>

          <span className={styles.tiles}>
            {TILES.map(([Icon, title, text]) => (
              <span key={title} className={styles.tile}>
                <Icon size={20} strokeWidth={2.1} aria-hidden="true" />
                <b>{title}</b>
                <small>{text}</small>
              </span>
            ))}
          </span>

          <span className={styles.foot}>
            <span className={styles.cta}>Become a host</span>
            <span className={styles.host}>
              <Image src="/landing/people/host-krunal.webp" alt="" width={96} height={96} className={styles.avatar} />
              <span>
                &ldquo;Payments arrive on time.&rdquo;
                <b>Krunal Iyer, fleet host</b>
              </span>
            </span>
          </span>
        </Link>
      </div>
    </section>
  );
}
