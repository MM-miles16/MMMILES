import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import ui from "./ui.module.css";
import styles from "./ClosingCta.module.css";

export default function ClosingCta() {
  return (
    <section className={`${ui.section} ${styles.section}`} aria-label="Get started">
      <div className={`${ui.container} ${styles.grid}`}>
        <article className={`${styles.card} ${styles.dark}`}>
          <Image src="/landing/3d/automobile.webp" alt="" width={240} height={240} className={styles.art} />
          <h2 className={styles.title}>Ready when you are</h2>
          <p className={styles.text}>Pick your dates and we&apos;ll have a clean, insured car at your door.</p>
          <Link href="/#search" className={`${ui.btn} ${ui.btnLight}`}>
            <Search size={18} aria-hidden="true" /> Find a car
          </Link>
        </article>

        <article className={`${styles.card} ${styles.lavender}`}>
          <Image src="/landing/3d/money-with-wings.webp" alt="" width={240} height={240} className={styles.art} />
          <h2 className={styles.title}>Own a car? Let it earn for you</h2>
          <p className={styles.text}>
            List your car on MM Miles with no registration or platform fees, and block dates whenever you need it.
          </p>
          <Link href="/host-registration" className={`${ui.btn} ${ui.btnDark}`}>
            Become a host <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </article>
      </div>
    </section>
  );
}
