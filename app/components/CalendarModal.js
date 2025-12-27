"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FaTimes, FaCalendarAlt, FaArrowRight, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import styles from "./CalendarModal.module.css";
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isAfter, isBefore, isToday, startOfDay, subMonths } from "date-fns";

export default function CalendarModal({
    isOpen,
    onClose,
    onApply,
    initialPickupDate,
    initialReturnDate
}) {
    const [mounted, setMounted] = useState(false);
    const [pickupDate, setPickupDate] = useState(null);
    const [returnDate, setReturnDate] = useState(null);

    // Date currently viewed (for the first month in the 2-month view)
    const [viewDate, setViewDate] = useState(startOfDay(new Date()));

    // Time state (0-23)
    const [pickupHour, setPickupHour] = useState(9);
    const [returnHour, setReturnHour] = useState(17);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            // Initialize state from props
            if (initialPickupDate) {
                setPickupDate(startOfDay(initialPickupDate));
                setPickupHour(initialPickupDate.getHours());
                // Set view to the pickup date so user sees their selection
                setViewDate(startOfMonth(initialPickupDate));
            } else {
                setViewDate(startOfMonth(new Date()));
            }
            if (initialReturnDate) {
                setReturnDate(startOfDay(initialReturnDate));
                setReturnHour(initialReturnDate.getHours());
            }
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const today = startOfDay(new Date());

    const handleDateClick = (date) => {
        if (isBefore(date, today)) return;

        if (!pickupDate || (pickupDate && returnDate)) {
            setPickupDate(date);
            setReturnDate(null);
        } else {
            // selecting return date
            if (isBefore(date, pickupDate)) {
                setPickupDate(date);
            } else if (isSameDay(date, pickupDate)) {
                setReturnDate(date);
            } else {
                setReturnDate(date);
            }
        }
    };

    const handleReset = () => {
        setPickupDate(null);
        setReturnDate(null);
        setViewDate(startOfMonth(new Date()));
    };

    const handleContinue = () => {
        if (pickupDate && returnDate) {
            const start = new Date(pickupDate);
            start.setHours(pickupHour, 0, 0, 0);

            const end = new Date(returnDate);
            end.setHours(returnHour, 0, 0, 0);

            onApply(start, end);
            onClose();
        }
    };

    const handlePrevMonth = () => {
        const prev = subMonths(viewDate, 1);
        if (!isBefore(prev, startOfMonth(today))) {
            setViewDate(prev);
        }
    };

    const handleNextMonth = () => {
        setViewDate(addMonths(viewDate, 1));
    };


    const formatTime = (hour) => {
        const h = hour % 12 || 12;
        const ampm = hour < 12 ? "AM" : "PM";
        return `${h}:00 ${ampm}`;
    };

    const isDateSelected = (date) => {
        if (!pickupDate) return false;
        if (isSameDay(date, pickupDate)) return true;
        if (returnDate && isSameDay(date, returnDate)) return true;
        return false;
    };

    const isDateInRange = (date) => {
        if (!pickupDate || !returnDate) return false;
        return isAfter(date, pickupDate) && isBefore(date, returnDate);
    };

    const isStart = (date) => pickupDate && isSameDay(date, pickupDate);
    const isEnd = (date) => returnDate && isSameDay(date, returnDate);

    // Render a single month grid
    const renderMonth = (monthDate) => {
        return (
            <div className={styles.monthContainer} key={monthDate.toString()}>
                <div className={styles.monthTitle}>{format(monthDate, "MMMM ''yy")}</div>

                <div className={styles.weekHeader}>
                    {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                        <div key={i} className={styles.weekDayName}>{d}</div>
                    ))}
                </div>

                <div className={styles.daysGrid}>
                    {/* Empty slots for start of month */}
                    {Array.from({ length: startOfMonth(monthDate).getDay() }).map((_, i) => (
                        <div key={`empty-${i}`} />
                    ))}

                    {eachDayOfInterval({
                        start: startOfMonth(monthDate),
                        end: endOfMonth(monthDate)
                    }).map((day) => {
                        const isDisabled = isBefore(day, today);
                        const selected = isDateSelected(day);
                        const inRange = isDateInRange(day);
                        const start = isStart(day);
                        const end = isEnd(day);

                        return (
                            <div
                                key={day.toString()}
                                className={`
                  ${styles.dayCell} 
                  ${isDisabled ? styles.disabled : ''}
                  ${selected ? styles.selected : ''}
                  ${inRange ? styles.range : ''}
                  ${start ? styles.start : ''}
                  ${end ? styles.end : ''}
                `}
                                onClick={() => !isDisabled && handleDateClick(day)}
                            >
                                {(inRange || (start && returnDate) || (end && pickupDate)) && (
                                    <div className={styles.rangeBackground} />
                                )}
                                <div className={styles.dayValue}>
                                    {format(day, "d")}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    if (!mounted) return null;

    return createPortal(
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className={styles.header}>
                    <button className={styles.closeButton} onClick={onClose}>
                        <FaTimes />
                    </button>
                    <button className={styles.resetButton} onClick={handleReset}>
                        Reset
                    </button>
                </div>

                {/* Date Summary */}
                <div className={styles.dateSummary}>
                    <div className={styles.dateDisplay}>
                        <FaCalendarAlt className={styles.icon} />
                        <span>
                            {pickupDate
                                ? `${format(pickupDate, "dd MMM''yy")}, ${formatTime(pickupHour)}`
                                : "Select Pickup"}
                        </span>
                    </div>
                    <FaArrowRight style={{ color: "#ccc", fontSize: "16px" }} />
                    <div className={styles.dateDisplay}>
                        <FaCalendarAlt className={styles.icon} />
                        <span>
                            {returnDate
                                ? `${format(returnDate, "dd MMM''yy")}, ${formatTime(returnHour)}`
                                : "Select Return"}
                        </span>
                    </div>
                </div>

                {/* Calendar Area (Horizontal Layout) */}
                <div className={styles.calendarWrapper}>
                    {/* Buttons for navigation */}
                    <button className={`${styles.navButton} ${styles.prev}`} onClick={handlePrevMonth} disabled={isSameMonth(viewDate, today) && isAfter(viewDate, subMonths(today, 1)) === false ? true : false}>
                        <FaChevronLeft />
                    </button>
                    <button className={`${styles.navButton} ${styles.next}`} onClick={handleNextMonth}>
                        <FaChevronRight />
                    </button>

                    <div className={styles.monthsRow}>
                        {renderMonth(viewDate)}
                        {/* Show next month as well */}
                        {renderMonth(addMonths(viewDate, 1))}
                    </div>
                </div>

                {/* Time Sliders & Submit */}
                <div className={styles.timeSection}>
                    <div className={styles.timeTitle}>Select the start time & end time</div>

                    <div className={styles.timeSliders}>
                        <div className={styles.timeBlock}>
                            <div className={styles.timeLabel}>Start Time</div>
                            <div className={styles.sliderContainer}>
                                <input
                                    type="range"
                                    min="0"
                                    max="23"
                                    value={pickupHour}
                                    onChange={(e) => setPickupHour(parseInt(e.target.value))}
                                    className={styles.slider}
                                />
                                <div className={styles.timeValue}>{formatTime(pickupHour)}</div>
                            </div>
                        </div>

                        <div className={styles.timeBlock}>
                            <div className={styles.timeLabel}>End Time</div>
                            <div className={styles.sliderContainer}>
                                <input
                                    type="range"
                                    min="0"
                                    max="23"
                                    value={returnHour}
                                    onChange={(e) => setReturnHour(parseInt(e.target.value))}
                                    className={styles.slider}
                                />
                                <div className={styles.timeValue}>{formatTime(returnHour)}</div>
                            </div>
                        </div>
                    </div>

                    <button
                        className={styles.submitButton}
                        onClick={handleContinue}
                        disabled={!pickupDate || !returnDate}
                        style={{ opacity: (!pickupDate || !returnDate) ? 0.5 : 1 }}
                    >
                        Continue
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
