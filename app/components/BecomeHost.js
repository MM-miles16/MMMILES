"use client";
import Image from "next/image";
import Link from "next/link";
import styles from "./BecomeHost.module.css";


export default function BecomeHost() {
  return (
    <section className={styles.HostSection} >
      <div className={styles.HostcontentWrapper}>
        
        <div className={styles.HostimageWrapper}>
          <Image
            src="/hostt.png"     // <-- put your image path here
            alt="Car booking steps illustration"
            width={1921}                 // large natural size
            height={600}                 // height in proportion
            className={styles.HoststepsImage}
            priority
          />
          <Link href="/host-registration">
            <button className={styles.HostFloatingButton}>Become a Host</button>
          </Link>

        </div>
      </div>
    </section>
  );
}
