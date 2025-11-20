"use client";
import Image from "next/image";
import styles from "./BookingSteps.module.css";

export default function BookingSteps() {
  return (
    <section className={styles.stepsSection} aria-label="Booking steps">
      <div className={styles.contentWrapper}>
        <h2 className={styles.heading}>Your Ride, Just a Few Clicks Away</h2>
        <p className={styles.subheading}>Smart Booking, Rent Easy, Made Easy</p>
        <div className={styles.imageWrapper}>
          <Image
            src="/5step.jpg"     // <-- put your image path here
            alt="Car booking steps illustration"
            width={1920}                 // large natural size
            height={600}                 // height in proportion
            className={styles.stepsImage}
            priority
          />
        </div>
      </div>
    </section>
  );
}
