"use client";

// Pickup & return picker — opened from the home search bar and the search page.
// Laptops: two panels. Left: "Pickup" and "Return" cards (date + time chips), the live trip length
// and Continue. Right: quick picks and two months side by side.
// Phones: a centred pop-up. Pick the dates and Continue straight away with the default times (9 AM
// pickup, 5 PM return), or tap "Change" to open a Pickup/Return switch over a grid of big time buttons
// grouped by Morning / Afternoon / Evening / Night.
// Rules (unchanged): pickup can't be in the past, trips are 6 hours to 29 days. Dates past the 29-day
// limit and return times under 6 hours are disabled up front, so there are no error pop-ups to hit.
// Same props as before: isOpen, onClose, onApply(start, end), initialPickupDate, initialReturnDate.

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, ChevronLeft, ChevronRight, Clock, Moon, RotateCcw, Sun, Sunrise, Sunset, X } from "lucide-react";
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isAfter,
  isBefore,
  isSameDay,
  nextSaturday,
  startOfDay,
  startOfMonth,
  subMonths,
} from "date-fns";
import styles from "./CalendarModal.module.css";

const MIN_HOURS = 6;
const MAX_DAYS = 29;
const MONTHS_AHEAD = 6; // how far ahead people can book
const HOUR_MS = 60 * 60 * 1000;
const HOURS = Array.from({ length: 24 }, (_, h) => h);
const WEEK = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const at = (day, hour) => {
  const d = new Date(day);
  d.setHours(hour, 0, 0, 0);
  return d;
};

const hourLabel = (h) => `${h % 12 || 12} ${h < 12 ? "AM" : "PM"}`;

const durationLabel = (ms) => {
  const total = Math.round(ms / HOUR_MS);
  const days = Math.floor(total / 24);
  const hrs = total % 24;
  return [days && `${days} day${days > 1 ? "s" : ""}`, hrs && `${hrs} hr${hrs > 1 ? "s" : ""}`].filter(Boolean).join(" ");
};

// One-tap trips, worked out from today
function quickPicks(now) {
  const tomorrow = addDays(startOfDay(now), 1);
  const saturday = nextSaturday(startOfDay(now));
  return [
    { id: "tomorrow", label: "Tomorrow", sub: "24 hrs", start: at(tomorrow, 9), end: at(addDays(tomorrow, 1), 9) },
    { id: "weekend", label: "Weekend", sub: "Sat – Mon", start: at(saturday, 9), end: at(addDays(saturday, 2), 9) },
    { id: "week", label: "1 week", sub: "7 days", start: at(tomorrow, 9), end: at(addDays(tomorrow, 7), 9) },
  ];
}

// A scrollable row of hour chips that keeps the chosen hour in view
function TimeRow({ label, value, onChange, isDisabled }) {
  const rowRef = useRef(null);

  useEffect(() => {
    const row = rowRef.current;
    const chip = row?.querySelector('[aria-checked="true"]');
    if (row && chip) {
      row.scrollTo({ left: chip.offsetLeft - row.clientWidth / 2 + chip.clientWidth / 2, behavior: "smooth" });
    }
  }, [value]);

  return (
    <div className={styles.time}>
      <p className={styles.timeLabel}>
        <Clock size={13} aria-hidden="true" /> {label}
      </p>
      <div ref={rowRef} className={styles.timeRow} role="radiogroup" aria-label={label}>
        {HOURS.map((h) => {
          const on = h === value;
          return (
            <button
              key={h}
              type="button"
              role="radio"
              aria-checked={on}
              disabled={isDisabled(h)}
              className={`${styles.chip} ${on ? styles.chipOn : ""}`}
              onClick={() => onChange(h)}
            >
              {hourLabel(h)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Phones: hours as big buttons, grouped by part of the day
const PERIODS = [
  { label: "Morning", icon: Sunrise, hours: [6, 7, 8, 9, 10, 11] },
  { label: "Afternoon", icon: Sun, hours: [12, 13, 14, 15, 16] },
  { label: "Evening", icon: Sunset, hours: [17, 18, 19, 20, 21, 22, 23] },
  { label: "Night", icon: Moon, hours: [0, 1, 2, 3, 4, 5] },
];

function TimeGrid({ label, value, onChange, isDisabled }) {
  const ref = useRef(null);

  // bring the chosen time into view when the tab opens
  useEffect(() => {
    ref.current?.querySelector('[aria-checked="true"]')?.scrollIntoView({ block: "center" });
  }, []);

  return (
    <div ref={ref} className={styles.slots} role="radiogroup" aria-label={label}>
      {PERIODS.map(({ label: period, icon: Icon, hours }) => (
        <div key={period} className={styles.period}>
          <p className={styles.periodLabel}>
            <Icon size={14} aria-hidden="true" /> {period}
          </p>
          <div className={styles.periodHours}>
            {hours.map((h) => {
              const on = h === value;
              return (
                <button
                  key={h}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  disabled={isDisabled(h)}
                  className={`${styles.slot} ${on ? styles.slotOn : ""}`}
                  onClick={() => onChange(h)}
                >
                  {hourLabel(h)}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

const isPhone = () => typeof window !== "undefined" && window.matchMedia("(max-width: 860px)").matches;

export default function CalendarModal({ isOpen, onClose, onApply, initialPickupDate, initialReturnDate }) {
  const [mounted, setMounted] = useState(false);
  const [pickup, setPickup] = useState(null);
  const [ret, setRet] = useState(null);
  const [pickupHour, setPickupHour] = useState(9);
  const [returnHour, setReturnHour] = useState(17);
  const [step, setStep] = useState("pickup");
  const [view, setView] = useState(() => startOfMonth(new Date()));
  const [slide, setSlide] = useState(0);
  const [hover, setHover] = useState(null);
  const [phase, setPhase] = useState("dates"); // phones: "dates" → "times"
  const [timeTab, setTimeTab] = useState("pickup");
  const scrollRef = useRef(null);

  useEffect(() => setMounted(true), []);

  // Start from the dates already in the search bar, lock the page, close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const p = initialPickupDate ? startOfDay(initialPickupDate) : null;
    setPickup(p);
    setRet(initialReturnDate ? startOfDay(initialReturnDate) : null);
    if (initialPickupDate) setPickupHour(initialPickupDate.getHours());
    if (initialReturnDate) setReturnHour(initialReturnDate.getHours());
    setView(startOfMonth(p && !isBefore(p, new Date()) ? p : new Date()));
    setStep("pickup");
    setPhase("dates");
    setTimeTab("pickup");

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Phones: scroll the month list to the pickup month
  useEffect(() => {
    if (!isOpen || !mounted) return;
    const list = scrollRef.current;
    const month = list?.querySelector(`[data-month="${format(view, "yyyy-MM")}"]`);
    if (list && month) list.scrollTop = month.offsetTop - 8;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, mounted]);

  if (!mounted || !isOpen) return null;

  const now = new Date();
  const today = startOfDay(now);
  const thisMonth = startOfMonth(today);
  const lastView = addMonths(thisMonth, MONTHS_AHEAD - 2);
  const noHoursLeftToday = now.getHours() >= 23;

  const start = pickup && at(pickup, pickupHour);
  const end = ret && at(ret, returnHour);
  const maxReturn = pickup && addDays(pickup, MAX_DAYS);

  // While choosing the return date, the range follows the pointer
  const previewing = step === "return" && pickup && hover && isAfter(hover, pickup) && !isAfter(hover, maxReturn);
  const rangeEnd = previewing ? hover : ret;

  const dayDisabled = (day) => {
    if (isBefore(day, today)) return true;
    if (isSameDay(day, today) && noHoursLeftToday) return true;
    if (step === "return" && pickup && isAfter(day, maxReturn)) return true;
    return false;
  };

  const pickupHourDisabled = (h) => Boolean(pickup && isSameDay(pickup, today) && h <= now.getHours());
  const returnHourDisabled = (h) => Boolean(start && ret && at(ret, h) - start < MIN_HOURS * HOUR_MS);

  const choosePickupHour = (h) => {
    setPickupHour(h);
    // keep a same-day return at least 6 hours later when it can be
    if (ret && isSameDay(ret, pickup) && returnHour - h < MIN_HOURS && h + MIN_HOURS <= 23) setReturnHour(h + MIN_HOURS);
  };

  const toTimes = (tab = "pickup") => {
    setTimeTab(tab);
    setPhase("times");
  };

  const toDates = (which) => {
    if (which) setStep(which);
    setPhase("dates");
  };

  // Phones: once the pickup time is in, move straight on to the return time
  const pickPickupTime = (h) => {
    choosePickupHour(h);
    setTimeout(() => setTimeTab("return"), 280);
  };

  const handleDay = (day) => {
    if (step === "pickup" || !pickup || isBefore(day, pickup)) {
      setPickup(day);
      if (ret && (isBefore(ret, day) || isAfter(ret, addDays(day, MAX_DAYS)))) setRet(null);
      if (isSameDay(day, today) && pickupHour <= now.getHours()) setPickupHour(Math.min(23, now.getHours() + 1));
      setStep("return");
    } else {
      setRet(day);
      if (isSameDay(day, pickup) && returnHour - pickupHour < MIN_HOURS) setReturnHour(Math.min(23, pickupHour + MIN_HOURS));
    }
    setHover(null);
  };

  const applyQuick = (q) => {
    setPickup(startOfDay(q.start));
    setRet(startOfDay(q.end));
    setPickupHour(q.start.getHours());
    setReturnHour(q.end.getHours());
    setStep("return");
    setSlide(0);
    setView(startOfMonth(q.start));
  };

  const reset = () => {
    setPickup(null);
    setRet(null);
    setPickupHour(9);
    setReturnHour(17);
    setStep("pickup");
    setView(thisMonth);
    setPhase("dates");
  };

  const go = (dir) => {
    const next = dir > 0 ? addMonths(view, 1) : subMonths(view, 1);
    if (isBefore(next, thisMonth) || isAfter(next, lastView)) return;
    setSlide(dir);
    setView(next);
  };

  // What to tell the person next, and whether they can continue
  let status;
  let valid = false;
  if (!pickup) status = "Choose your pickup date";
  else if (!ret) status = "Now choose your return date";
  else if (start < now) status = "That pickup time has passed, pick a later one";
  else if (end - start < MIN_HOURS * HOUR_MS) status = "Trips need to be at least 6 hours";
  else {
    valid = true;
    status = durationLabel(end - start);
  }

  const submit = () => {
    if (!valid) return;
    onApply(start, end);
    onClose();
  };

  const picks = quickPicks(now);
  const activePick = picks.find(
    (q) => start && end && +q.start === +start && +q.end === +end
  )?.id;

  const renderMonth = (month, withWeek = false) => (
    <div className={styles.month} key={format(month, "yyyy-MM")} data-month={format(month, "yyyy-MM")}>
      <p className={styles.monthTitle}>{format(month, "MMMM yyyy")}</p>
      {withWeek && (
        <div className={styles.week} aria-hidden="true">
          {WEEK.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
      )}
      <div className={styles.days} onMouseLeave={() => setHover(null)}>
        {Array.from({ length: startOfMonth(month).getDay() }).map((_, i) => (
          <span key={`gap-${i}`} className={styles.gap} />
        ))}
        {eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) }).map((day) => {
          const disabled = dayDisabled(day);
          const isStart = pickup && isSameDay(day, pickup);
          const isEnd = rangeEnd && isSameDay(day, rangeEnd);
          const inRange = pickup && rangeEnd && isAfter(day, pickup) && isBefore(day, rangeEnd);
          const banded = rangeEnd && pickup && !isSameDay(pickup, rangeEnd);
          const cls = [
            styles.day,
            disabled && styles.off,
            isSameDay(day, today) && styles.today,
            inRange && styles.inRange,
            isStart && styles.start,
            isEnd && styles.end,
            banded && isStart && styles.bandRight,
            banded && isEnd && styles.bandLeft,
            previewing && (inRange || isEnd) && styles.preview,
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <button
              key={day.toISOString()}
              type="button"
              className={cls}
              disabled={disabled}
              onClick={() => handleDay(day)}
              onMouseEnter={() => setHover(day)}
              aria-label={format(day, "EEEE, d MMMM yyyy")}
              aria-pressed={Boolean(isStart || (isEnd && !previewing))}
            >
              <span>{format(day, "d")}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  const pickupRow = (
    <TimeRow label="Pickup time" value={pickupHour} onChange={choosePickupHour} isDisabled={pickupHourDisabled} />
  );
  const returnRow = (
    <TimeRow label="Return time" value={returnHour} onChange={setReturnHour} isDisabled={returnHourDisabled} />
  );

  const card = (which) => {
    const isPickup = which === "pickup";
    const day = isPickup ? pickup : ret;
    const hour = isPickup ? pickupHour : returnHour;
    return (
      <div className={`${styles.card} ${step === which ? styles.cardOn : ""}`}>
        <button type="button" className={styles.cardHead} onClick={() => toDates(which)} aria-pressed={step === which}>
          <span className={styles.cardLabel}>{isPickup ? "Pickup" : "Return"}</span>
          <span className={styles.cardDate} key={day ? day.toISOString() : "empty"}>
            {day ? format(day, "EEE, d MMM") : "Add date"}
          </span>
          {day && <span className={styles.cardTime}>{hourLabel(hour)}</span>}
        </button>
        <div className={styles.cardTimes}>{isPickup ? pickupRow : returnRow}</div>
      </div>
    );
  };

  const footer = (
    <div className={styles.action}>
      <p className={`${styles.status} ${valid ? styles.statusOk : ""}`} key={status} aria-live="polite">
        {valid ? (
          <>
            Trip length <b>{status}</b>
          </>
        ) : (
          status
        )}
      </p>
      <button type="button" className={styles.submit} onClick={submit} disabled={!valid} key={valid ? "go" : "wait"}>
        Continue <ArrowRight size={17} aria-hidden="true" />
      </button>
    </div>
  );

  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="calendar-title"
        data-phase={phase}
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.header}>
          <div className={styles.headMain}>
            {phase === "times" && (
              <button type="button" className={styles.back} onClick={() => toDates()} aria-label="Back to dates">
                <ChevronLeft size={18} />
              </button>
            )}
            <div>
              <h2 id="calendar-title" className={styles.title}>
                {phase === "times" ? "Choose your times" : "When do you need the car?"}
              </h2>
              <p className={styles.sub}>
                {phase === "times" && pickup && ret
                  ? `${format(pickup, "EEE d MMM")} → ${format(ret, "EEE d MMM")}`
                  : "Trips from 6 hours to 29 days"}
              </p>
            </div>
          </div>
          <div className={styles.headTools}>
            {(pickup || ret) && (
              <button type="button" className={styles.reset} onClick={reset} aria-label="Reset dates">
                <RotateCcw size={14} aria-hidden="true" />
                <span className={styles.resetText}>Reset</span>
              </button>
            )}
            <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          </div>
        </header>

        <div className={styles.body}>
          {/* Left panel (laptops) / tabs (phones) */}
          <aside className={styles.side}>
            <div className={styles.cards}>
              {card("pickup")}
              <span className={styles.cardsArrow} aria-hidden="true">
                <ArrowRight size={14} />
              </span>
              {card("return")}
            </div>
            <div className={styles.sideFooter}>{footer}</div>
          </aside>

          {/* Calendar */}
          <section className={styles.cal}>
            <div className={styles.quick} role="group" aria-label="Quick picks">
              {picks.map((q) => (
                <button
                  key={q.id}
                  type="button"
                  className={`${styles.quickBtn} ${activePick === q.id ? styles.quickOn : ""}`}
                  onClick={() => applyQuick(q)}
                >
                  {q.label} <small>{q.sub}</small>
                </button>
              ))}
            </div>

            {/* Laptops: two months with arrows */}
            <div className={styles.desk}>
              <button
                type="button"
                className={`${styles.nav} ${styles.navPrev}`}
                onClick={() => go(-1)}
                disabled={!isAfter(view, thisMonth)}
                aria-label="Previous month"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                className={`${styles.nav} ${styles.navNext}`}
                onClick={() => go(1)}
                disabled={!isBefore(view, lastView)}
                aria-label="Next month"
              >
                <ChevronRight size={18} />
              </button>
              <div
                className={`${styles.months} ${slide > 0 ? styles.slideNext : slide < 0 ? styles.slidePrev : ""}`}
                key={format(view, "yyyy-MM")}
              >
                {[view, addMonths(view, 1)].map((m) => renderMonth(m, true))}
              </div>
            </div>

            {/* Phones: months scroll vertically */}
            <div className={styles.phone}>
              <div className={`${styles.week} ${styles.weekSticky}`} aria-hidden="true">
                {WEEK.map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>
              <div ref={scrollRef} className={styles.scroll}>
                {Array.from({ length: MONTHS_AHEAD }, (_, i) => renderMonth(addMonths(thisMonth, i)))}
              </div>
            </div>
          </section>
        </div>

        {/* Phones, step 2: times */}
        {phase === "times" && (
          <section className={styles.phoneTimes}>
            <div className={styles.seg} role="tablist" aria-label="Which time">
              <span className={styles.segThumb} data-side={timeTab} aria-hidden="true" />
              {[
                ["pickup", "Pickup time", pickupHour],
                ["return", "Return time", returnHour],
              ].map(([id, label, hour]) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={timeTab === id}
                  className={styles.segBtn}
                  onClick={() => setTimeTab(id)}
                >
                  <small>{label}</small>
                  <b key={hour}>{hourLabel(hour)}</b>
                </button>
              ))}
            </div>
            {timeTab === "pickup" ? (
              <TimeGrid key="pickup" label="Pickup time" value={pickupHour} onChange={pickPickupTime} isDisabled={pickupHourDisabled} />
            ) : (
              <TimeGrid key="return" label="Return time" value={returnHour} onChange={setReturnHour} isDisabled={returnHourDisabled} />
            )}
          </section>
        )}

        {/* Phones: default times are already set; a small line lets people change them, then Continue */}
        <div className={styles.phoneFooter}>
          {phase === "dates" && pickup && (
            <button type="button" className={styles.timesLink} onClick={() => toTimes("pickup")}>
              <Clock size={15} className={styles.timesIcon} aria-hidden="true" />
              <span className={styles.timesText}>
                Pickup <b>{hourLabel(pickupHour)}</b>
                <i className={styles.timesSep} aria-hidden="true" />
                Return <b>{hourLabel(returnHour)}</b>
              </span>
              <span className={styles.timesEdit}>Change</span>
            </button>
          )}
          {footer}
        </div>
      </div>
    </div>,
    document.body
  );
}
