"use client";
import styles from "./AccountSuccess.module.css";

export default function PaymentSuccess() {
  return (
    <section
      className={styles.paySuccessSection}
      aria-label="Payment success"
    >
      <div className={styles.paySuccessCard}>
        {/* Top green area */}
        <div className={styles.paySuccessHero}>
          <div className={styles.paySuccessIconCircle}>
            <span className={styles.paySuccessIconThumb}>👍</span>
          </div>
        </div>

        {/* White content area */}
        <div className={styles.paySuccessContent}>
          <h1 className={styles.paySuccessTitle}>Thank you!</h1>

          <p className={styles.paySuccessStatusRow}>
            <span className={styles.paySuccessCheckIcon}>✔</span>
            <span>Payment Done Successfully</span>
          </p>

          <p className={styles.paySuccessDescription}>
            Your payment has been processed successfully. You can now access
            your profile and manage your bookings.
          </p>

          <button className={styles.paySuccessPrimaryButton}>
            Take me to my Profile
          </button>
        </div>
      </div>
    </section>
  );
}
