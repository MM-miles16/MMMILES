"use client";
// "This car isn't available right now" — shown when Book is tapped on a car that can't be booked
// (e.g. the Bengaluru preview cars, see lib/showcase). Shows what was being booked (photo, name,
// dates) and two ways to get help: the on-site chat assistant and email (reply within 12 hours).
// Desktop: a centred card. Phones: a bottom sheet above the tab bar.
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { CalendarX2, ChevronRight, Clock3, Mail, MessageCircle, X } from "lucide-react";
import { canonicalCity, cities } from "@/lib/cities";
import { parseTripTime } from "@/lib/searchDefaults";
import styles from "./UnavailableDialog.module.css";

const FALLBACK_EMAIL = "support@mmmiles.com";
const REPLY_WITHIN = "12 hours";
const EXIT_MS = 200;

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const friendly = (d) => {
  const h = d.getHours();
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}, ${h % 12 || 12} ${h < 12 ? "AM" : "PM"}`;
};

function emailFor(city) {
  const c = cities.find((x) => canonicalCity(x.name) === canonicalCity(city));
  return c?.email || FALLBACK_EMAIL;
}

export default function UnavailableDialog({ open, onClose, carName, city, image, pickup, returnTime }) {
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(false);
  const panelRef = useRef(null);
  const closeRef = useRef(null);
  const returnFocusRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose; // latest handler without re-running the open/close setup

  // Mount on open; on close, play the exit animation first
  useEffect(() => {
    if (open) {
      setMounted(true);
      setClosing(false);
      return;
    }
    if (!mounted) return;
    setClosing(true);
    const t = setTimeout(() => {
      setMounted(false);
      setClosing(false);
    }, EXIT_MS);
    return () => clearTimeout(t);
  }, [open, mounted]);

  // While open: lock page scroll, hide the chat bubble, focus inside, Escape closes, Tab stays
  // inside; focus returns to the Book button afterwards
  useEffect(() => {
    if (!open) return;
    returnFocusRef.current = document.activeElement;
    document.body.classList.add("sheet-open");
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = setTimeout(() => panelRef.current?.querySelector("[data-primary]")?.focus(), 30);

    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const items = [...panelRef.current.querySelectorAll("a[href], button:not([disabled])")];
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);

    return () => {
      clearTimeout(focusTimer);
      document.removeEventListener("keydown", onKey);
      document.body.classList.remove("sheet-open");
      document.body.style.overflow = prevOverflow;
      returnFocusRef.current?.focus?.();
    };
  }, [open]);

  if (!mounted || typeof document === "undefined") return null;

  const start = parseTripTime(pickup);
  const end = parseTripTime(returnTime);
  const hasDates = Boolean(start && end && !isNaN(start) && !isNaN(end));
  const dates = hasDates ? `${friendly(start)} to ${friendly(end)}` : null;
  const place = city ? canonicalCity(city) : "";
  const email = emailFor(city);
  const subject = `Booking help: ${carName}${place ? ` in ${place}` : ""}`;
  const body = `Hi MM Miles,\n\nI'd like to book the ${carName}${place ? ` in ${place}` : ""}${dates ? ` (${dates})` : ""}. Could you help?\n\nThanks`;

  // Close first, then open the chat assistant (its bubble is hidden while this is open)
  const openChat = () => {
    onCloseRef.current();
    setTimeout(() => window.dispatchEvent(new Event("open-chat")), EXIT_MS + 20);
  };

  return createPortal(
    <div className={`${styles.root} ${closing ? styles.closing : ""}`} data-mm>
      <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="unavailable-title"
        aria-describedby="unavailable-text"
      >
        <span className={styles.handle} aria-hidden="true" />

        <div className={styles.header}>
          <h2 id="unavailable-title" className={styles.title}>
            This car isn&apos;t available right now
          </h2>
          <button ref={closeRef} type="button" className={styles.close} onClick={onClose} aria-label="Close">
            <X size={18} strokeWidth={2.2} />
          </button>
        </div>
        <p id="unavailable-text" className={styles.text}>
          Please try again after some time, or reach out and we&apos;ll help you plan your trip.
        </p>

        {/* What they tried to book */}
        <div className={styles.car}>
          <span className={styles.thumb}>
            {image ? <Image src={image} alt="" fill sizes="88px" className={styles.thumbImg} /> : null}
          </span>
          <span className={styles.carText}>
            <span className={styles.carName}>{carName}</span>
            {hasDates && (
              // each date stays on one line; a wrap can only happen around "to"
              <span className={styles.carDates}>
                <span className={styles.nowrap}>{friendly(start)}</span> to{" "}
                <span className={styles.nowrap}>{friendly(end)}</span>
              </span>
            )}
          </span>
          <CalendarX2 className={styles.carIcon} size={20} strokeWidth={1.9} aria-label="Not available" />
        </div>

        {/* Ways to get help */}
        <div className={styles.options}>
          <button type="button" className={styles.option} onClick={openChat} data-primary>
            <span className={`${styles.optionIcon} ${styles.optionIconDark}`} aria-hidden="true">
              <MessageCircle size={20} strokeWidth={2} />
            </span>
            <span className={styles.optionText}>
              <span className={styles.optionTitle}>Chat with us</span>
              <span className={styles.optionSub}>Ask our assistant anything</span>
            </span>
            <ChevronRight className={styles.chevron} size={18} aria-hidden="true" />
          </button>
          <a
            className={styles.option}
            href={`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`}
          >
            <span className={styles.optionIcon} aria-hidden="true">
              <Mail size={20} strokeWidth={2} />
            </span>
            <span className={styles.optionText}>
              <span className={styles.optionTitle}>Mail us</span>
              <span className={styles.optionSub}>{email}</span>
            </span>
            <ChevronRight className={styles.chevron} size={18} aria-hidden="true" />
          </a>
        </div>

        <p className={styles.promise}>
          <Clock3 size={15} strokeWidth={2} aria-hidden="true" />
          We respond within {REPLY_WITHIN}
        </p>
      </div>
    </div>,
    document.body
  );
}
