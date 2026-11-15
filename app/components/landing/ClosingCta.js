import Image from "next/image";
import Link from "next/link";
import { Check, MapPin } from "lucide-react";
import HostMap from "./HostMap";
import ui from "./ui.module.css";
import styles from "./ClosingCta.module.css";

// Numbered tag, like "01 Weekly payouts"
function Tag({ n, children }) {
  return (
    <span className={styles.tag}>
      <i>{n}</i>
      <span>{children}</span>
    </span>
  );
}

// "Become a host": the whole panel is one link to /host-registration. Payout share (80%+) and the
// commission cap come from the host page; the host and his words are from its "Happy hosts" section.
export default function ClosingCta() {
  return (
    <section className={`${ui.section} ${styles.section}`} aria-labelledby="host-title">
      <div className={ui.container}>
        <Link href="/host-registration" className={styles.panel}>
          <span className={styles.intro}>
            <span className={`${ui.eyebrow} ${styles.eyebrow}`}>For car owners</span>
            <h2 id="host-title" className={styles.title}>
              Own a car? Let it <span>earn for you</span>
            </h2>
            <span className={styles.lead}>
              We&apos;re expanding hosting across Chennai, Bengaluru and Hyderabad. List your car, keep 80% or more of
              every booking and get paid every week.
            </span>
            <span className={`${ui.btn} ${ui.btnDark} ${styles.cta}`}>Become a host</span>
          </span>

          <HostMap id="host-map-board" className={styles.mapSlot} />

          <span className={styles.cards}>
            <span className={styles.stack}>
              {/* 01 Weekly payouts */}
              <span className={`${styles.card} ${styles.white} ${styles.payout}`}>
                <Tag n="01">Weekly payouts</Tag>
                <span className={styles.keep}>
                  <small>You keep</small>
                  <b>80%+</b>
                </span>
                <span className={styles.split}>
                  <span className={styles.splitYou} />
                  <span className={styles.splitUs}>20%</span>
                </span>
                <span className={styles.note}>Paid to your bank every week</span>
              </span>

              {/* 02 Host support */}
              <span className={`${styles.card} ${styles.frost} ${styles.support}`}>
                <Tag n="02">24/7 host support</Tag>
                <span className={styles.supportRow}>
                  <span className={styles.note}>A dedicated team on call or WhatsApp, day or night</span>
                  <Image src="/landing/3d/headphone.webp" alt="" width={120} height={120} className={styles.supportArt} />
                </span>
              </span>
            </span>

            {/* 03 A real host */}
            <span className={`${styles.card} ${styles.frost} ${styles.host}`}>
              <Tag n="03">Happy hosts</Tag>
              <span className={styles.rings}>
                <Image
                  src="/landing/people/host-krunal.webp"
                  alt="Krunal Iyer, a host on MM Miles"
                  width={240}
                  height={240}
                  className={styles.face}
                />
              </span>
              <span className={styles.quote}>
                &ldquo;Payments arrive on time, and I always know what&apos;s happening with my car.&rdquo;
                <b>Krunal Iyer, fleet host</b>
              </span>
            </span>

            {/* 04 OTP handover */}
            <span className={`${styles.card} ${styles.white} ${styles.otp}`}>
              <Tag n="04">OTP pickup &amp; drop</Tag>
              <span className={styles.shieldWrap}>
                <Image src="/landing/3d/shield.webp" alt="" width={160} height={160} className={styles.shield} />
                <span className={styles.badge}>
                  <Check size={13} strokeWidth={3} aria-hidden="true" /> OTP verified
                </span>
              </span>
              <span className={styles.note}>Your car changes hands only after the renter shares the OTP</span>
            </span>

            {/* 05 Cities */}
            <span className={`${styles.card} ${styles.frost} ${styles.cities}`}>
              <Tag n="05">Expanding to 3 cities</Tag>
              {[
                ["Chennai", "Tamil Nadu"],
                ["Bengaluru", "Karnataka"],
                ["Hyderabad", "Telangana"],
              ].map(([city, state]) => (
                <span key={city} className={styles.cityRow}>
                  <span className={styles.cityIcon}>
                    <MapPin size={15} strokeWidth={2.2} aria-hidden="true" />
                  </span>
                  <span className={styles.cityText}>
                    <b>{city}</b>
                    <small>{state}</small>
                  </span>
                </span>
              ))}
            </span>
          </span>
        </Link>
      </div>
    </section>
  );
}
