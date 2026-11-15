"use client";
import { useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import styles from "./FooterDirectory.module.css";

// One directory group. Open on tablets and up; on phones it starts collapsed, app-style.
// The links are in the HTML either way, so search engines always see them.
export default function FooterGroup({ title, count, children }) {
  const ref = useRef(null);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 761px)");
    const sync = () => {
      if (ref.current) ref.current.open = mq.matches;
    };
    sync();
    mq.addEventListener?.("change", sync);
    return () => mq.removeEventListener?.("change", sync);
  }, []);

  return (
    <details ref={ref} className={styles.group} open>
      <summary className={styles.summary}>
        <h2 className={styles.title}>{title}</h2>
        <span className={styles.count}>{count}</span>
        <ChevronDown size={18} className={styles.chevron} aria-hidden="true" />
      </summary>
      {children}
    </details>
  );
}
