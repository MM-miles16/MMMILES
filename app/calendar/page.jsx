"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import styles from "./calendar.module.css";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function Calendar({
  month = "July",
  year = 2025,
  initialRange = [14, 20],
  onSchedule,
}) {
  const [range, setRange] = useState(initialRange);
  const [aiNotes, setAiNotes] = useState(true);

  const handleDayClick = (day) => {
    if (!range[0] || (range[0] && range[1])) {
      setRange([day, null]);
    } else {
      setRange([range[0], day]);
    }
  };

  return (
    <div className={styles.wrapper}>
      <motion.div
        className={styles.calendarCard}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        {/* LEFT */}
        <div className={styles.left}>
          <div className={styles.monthHeader}>
            <button>‹</button>
            <h3>{month} {year}</h3>
            <button>›</button>
          </div>

          <div className={styles.weekdays}>
            {WEEKDAYS.map(d => <span key={d}>{d}</span>)}
          </div>

          <div className={styles.days}>
            {Array.from({ length: 31 }).map((_, i) => {
              const day = i + 1;
              const isStart = day === range[0];
              const isEnd = day === range[1];
              const inRange =
                range[1] && day > range[0] && day < range[1];

              return (
                <motion.div
                  key={day}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`${styles.day}
                    ${isStart || isEnd ? styles.selected : ""}
                    ${inRange ? styles.inRange : ""}`}
                  onClick={() => handleDayClick(day)}
                >
                  {day}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* RIGHT */}
        <div className={styles.right}>
          <div className={styles.field}>
            <label>Start date & time</label>
            <div className={styles.row}>
              <input
                className={styles.input}
                value={`${month} ${range[0] || "--"}, ${year}`}
                readOnly
              />
              <span className={styles.time}>9:00 am</span>
            </div>
          </div>

          <div className={styles.field}>
            <label>End date & time</label>
            <div className={styles.row}>
              <input
                className={styles.input}
                value={`${month} ${range[1] || "--"}, ${year}`}
                readOnly
              />
              <span className={styles.time}>10:00 am</span>
            </div>
          </div>

         
        </div>
      </motion.div>

      {/* FOOTER */}
      <div className={styles.footer}>
        <span className={styles.summary}>
          Drive: {month} {range[0]} — {range[1]}
        </span>
        <div className={styles.actions}>
          <button className={styles.cancel}>Cancel</button>
          <button
            className={styles.primary}
            onClick={() =>
              onSchedule?.({ range, aiNotes })
            }
          >
            Schedule
          </button>
        </div>
      </div>
    </div>
  );
}
