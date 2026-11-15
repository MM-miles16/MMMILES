"use client";
import { useState } from "react";
import { Check, Copy } from "lucide-react";
import styles from "./Offers.module.css";

// Promo code shown on a number plate, with a one-tap copy button
export default function CopyCode({ code }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (e.g. insecure context) — the code is still visible to type
    }
  };

  return (
    <div className={styles.code}>
      <span className={styles.plate}>
        <span className={styles.plateBand} aria-hidden="true">
          <span className={styles.holo} />
          IND
        </span>
        <span className={styles.plateText}>{code}</span>
      </span>
      <button
        type="button"
        className={`${styles.copyBtn} ${copied ? styles.copied : ""}`}
        onClick={copy}
        aria-label={`Copy code ${code}`}
      >
        {copied ? <Check size={18} strokeWidth={2.5} /> : <Copy size={18} />}
        <span aria-live="polite">{copied ? "Copied" : "Copy code"}</span>
      </button>
    </div>
  );
}
