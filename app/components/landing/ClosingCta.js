import Link from "next/link";
import { BadgePercent, ShieldCheck, Wallet } from "lucide-react";
import ui from "./ui.module.css";
import styles from "./ClosingCta.module.css";

// "Become a host" — one compact panel; the whole panel is the link. Facts come from the host page
// (/host-registration): commission capped at 20%, payments within 7 days, verified renters.
const CHIPS = [
  [BadgePercent, "Max 20% commission"],
  [Wallet, "Paid in 7 days"],
  [ShieldCheck, "Verified renters"],
];

export default function ClosingCta() {
  return (
    <section className={`${ui.section} ${styles.section}`} aria-labelledby="host-title">
      <div className={ui.container}>
        <Link href="/host-registration" className={styles.panel}>
          <span className={styles.content}>
            <span className={`${ui.eyebrow} ${styles.eyebrow}`}>For car owners</span>
            <h2 id="host-title" className={styles.title}>
              Own a car? Let it earn for you
            </h2>
            <span className={styles.lead}>List it on MM Miles, keep 80% or more of every booking and block dates any time.</span>
            <span className={styles.chips}>
              {CHIPS.map(([Icon, label]) => (
                <span key={label} className={styles.chip}>
                  <Icon size={15} strokeWidth={2.2} aria-hidden="true" /> {label}
                </span>
              ))}
            </span>
          </span>

          <span className={styles.side}>
            <span className={styles.keep} aria-hidden="true">
              <small>You keep</small>
              <b>80%+</b>
              <span className={styles.split}>
                <span className={styles.splitYou} />
                <span className={styles.splitUs}>20%</span>
              </span>
            </span>
            <span className={`${ui.btn} ${ui.btnDark} ${styles.cta}`}>Become a host</span>
          </span>
        </Link>
      </div>
    </section>
  );
}
