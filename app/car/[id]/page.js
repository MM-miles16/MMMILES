"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import styles from "./carDetail.module.css";
import { supabase } from "../../../lib/supabaseClient";

/**
 * Parse a date-time string.
 * Accepts:
 *  - "DD/MM/YYYY HH:MM"  (e.g. "10/11/2025 09:00")
 *  - ISO strings (e.g. "2025-11-10T09:00:00Z" or "2025-11-10 09:00")
 */
function parseDateTime(str) {
  if (!str) return null;
  // try dd/mm/yyyy HH:MM
  const ddmmyy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})[ T](\d{1,2}):(\d{2})$/;
  const m = str.match(ddmmyy);
  if (m) {
    const [, dd, mm, yyyy, hh, min] = m;
    // construct local Date
    return new Date(
      Number(yyyy),
      Number(mm) - 1,
      Number(dd),
      Number(hh),
      Number(min),
      0,
      0
    );
  }

  // Try ISO or other parsable forms
  const d = new Date(str);
  if (!isNaN(d.getTime())) return d;

  return null;
}

/**
 * Break a continuous time range into per-day ranges with hours per day.
 * Returns array of { date: 'YYYY-MM-DD', start: Date, end: Date, hours: number }
 *
 * Billing rule: we count actual hours in each day, and round up fractional hours for billing.
 */
function splitIntoDaysWithHours(startDate, endDate) {
  if (!(startDate instanceof Date) || !(endDate instanceof Date)) return [];
  if (endDate <= startDate) return [];

  const dayRanges = [];
  let cursor = new Date(startDate); // mutable
  // iterate until cursor >= endDate
  while (cursor < endDate) {
    const dayStart = new Date(
      cursor.getFullYear(),
      cursor.getMonth(),
      cursor.getDate(),
      0,
      0,
      0,
      0
    );

    // end of this day = next midnight
    const nextMidnight = new Date(dayStart);
    nextMidnight.setDate(dayStart.getDate() + 1);

    const segStart = cursor > dayStart ? new Date(cursor) : dayStart;
    const segEnd = endDate < nextMidnight ? new Date(endDate) : nextMidnight;

    // compute hours (fractional)
    const hours = (segEnd - segStart) / (1000 * 60 * 60);

    // billing: round up fractional hours to next full hour
    const billedHours = Math.ceil(hours);

    dayRanges.push({
      date: dayStart.toISOString().slice(0, 10), // YYYY-MM-DD
      start: segStart,
      end: segEnd,
      hours,
      billedHours,
    });

    cursor = nextMidnight;
  }

  return dayRanges;
}

export default function CarDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pickupRaw = searchParams.get("pickup") || searchParams.get("pickupTime");
  const returnRaw = searchParams.get("return") || searchParams.get("returnTime");

  const [car, setCar] = useState(null);
  const [images, setImages] = useState([]);
  const [host, setHost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);

  // parsed datetimes
  const pickupDt = parseDateTime(pickupRaw);
  const returnDt = parseDateTime(returnRaw);

  useEffect(() => {
    async function fetchCarDetails() {
      try {
        // Get vehicle + host data
        const { data: vehicle, error: vehicleError } = await supabase
          .from("vehicles")
          .select("*, hosts(*)")
          .eq("id", id)
          .single();

        if (vehicleError) throw vehicleError;

        setCar(vehicle);
        setHost(vehicle.hosts || null);

        // Fetch vehicle images
        const { data: imgs, error: imgErr } = await supabase
          .from("vehicle_images")
          .select("*")
          .eq("vehicle_id", id)
          .order("is_primary", { ascending: false });

        if (imgErr) throw imgErr;
        setImages(imgs?.length ? imgs : []);
      } catch (err) {
        console.error("Error loading car details:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchCarDetails();
  }, [id]);

  if (loading)
    return (
      <div className={styles.loadingWrapper}>
        <p>Loading car details...</p>
      </div>
    );

  if (!car)
    return (
      <div className={styles.errorWrapper}>
        <p>Car not found.</p>
      </div>
    );

  const gallery = images.length > 0 ? images.map((img) => img.image_url) : ["/cars/default.jpg"];
  const selectedImg = gallery[activeImage] || gallery[0];

  // ----------- Pricing logic ----------
  // fallback to numeric hourly_rate
  const hourlyRate = Number(car.hourly_rate) || 0;

  // if pickup/return valid -> compute breakdown otherwise show placeholders
  let dayRanges = [];
  let totalBilledHours = 0;
  let totalActualHours = 0;
  if (pickupDt && returnDt && returnDt > pickupDt) {
    dayRanges = splitIntoDaysWithHours(pickupDt, returnDt);
    totalBilledHours = dayRanges.reduce((s, r) => s + r.billedHours, 0);
    totalActualHours = dayRanges.reduce((s, r) => s + r.hours, 0);
  }

  // cost parts (hardcoded fees as you requested)
  const protectionFee = 4176; // hardcoded for now
  const convenienceFee = 639; // hardcoded for now
  const refundableDeposit = 1000; // hardcoded for now

  const tripAmount = totalBilledHours * hourlyRate; // billed hours * rate
  const totalPrice = tripAmount + protectionFee + convenienceFee;
  const finalAmount = totalPrice + refundableDeposit;

  const formatINR = (n) =>
    typeof n === "number" ? `₹${n.toLocaleString("en-IN")}` : "₹0";

  return (
    <div className={styles.container}>
      <button onClick={() => router.back()} className={styles.backBtn}>
        ← Back
      </button>

      {/* Top image */}
      <div className={styles.mainImage}>
        <Image src={selectedImg} alt="Car main" fill className={styles.imageFill} />
      </div>

      <div className={styles.thumbnails}>
        {gallery.map((img, i) => (
          <div
            key={i}
            className={`${styles.thumbnail} ${activeImage === i ? styles.activeThumbnail : ""}`}
            onClick={() => setActiveImage(i)}
          >
            <Image src={img} alt={`thumb ${i}`} fill className={styles.imageFill} />
          </div>
        ))}
      </div>

      <div className={styles.detailsWrapper}>
        <div className={styles.detailsContent}>
          <h1 className={styles.carName}>
            {car.make} {car.model} {car.model_year ? `(${car.model_year})` : ""}
          </h1>

          <p className={styles.description}>
            <strong>{car.vehicle_type}</strong> • {car.transmission_type} • {car.fuel_type} • {car.seating_capacity} Seats
          </p>

          <div className={styles.hostBlock}>
            <p className={styles.hostTitle}>Hosted by</p>
            <h3 className={styles.hostName}>{host?.full_name || "Host details unavailable"}</h3>
            <p className={styles.hostDesc}>MMmiles Verified Partner • Reliable & Quality Experience</p>
          </div>

          <div className={styles.infoSection}>
            <h3>Car Location</h3>
            <p><strong>{car.location_name}</strong>, {car.city}</p>
            <p>📍 Coordinates: {car.latitude}, {car.longitude}</p>
          </div>

          <div className={styles.infoSection}>
            <h3>MMmiles Protection</h3>
            <p>Insurance Status: <strong>{car.insurance_status === "active" ? "Active & Covered" : "Expired"}</strong></p>
            <p>Last Serviced: {car.last_service || "N/A"}</p>
          </div>

          <div className={styles.infoSection}>
            <h3>Features</h3>
            <ul>
              <li>ABS + Airbags</li>
              <li>Reverse Camera</li>
              <li>Power Windows</li>
              <li>Power Steering</li>
            </ul>
          </div>

          <div className={styles.reviewBlock}>
            <h3>Ratings & Reviews</h3>
            <p>⭐ 4.9 — “Smooth drive, well maintained!”</p>
            <p className={styles.todoText}>TODO: Link with reviews table</p>
          </div>

          {/* Per-day breakdown (only when pickup/return provided) */}
          {dayRanges.length > 0 ? (
            <div className={styles.breakdownSection}>
              <h3>Trip Breakdown</h3>
              <p>
                Pickup: {pickupDt.toLocaleString()} • Return: {returnDt.toLocaleString()}
              </p>

              <table className={styles.breakdownTable}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Actual hrs</th>
                    <th>Billed hrs</th>
                    <th>Cost (@ {formatINR(hourlyRate)}/hr)</th>
                  </tr>
                </thead>
                <tbody>
                  {dayRanges.map((r) => {
                    const cost = r.billedHours * hourlyRate;
                    return (
                      <tr key={r.date}>
                        <td>{r.date}</td>
                        <td>{r.hours.toFixed(2)}</td>
                        <td>{r.billedHours}</td>
                        <td>{formatINR(cost)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <p className={styles.summarySmall}>
                Total actual hours: {totalActualHours.toFixed(2)} • Billed hours: {totalBilledHours}
              </p>
            </div>
          ) : (
            <div className={styles.infoSection}>
              <p className={styles.todoText}>Add pickup and return time to calculate price.</p>
            </div>
          )}
        </div>

        {/* Booking summary sticky card */}
        <div className={styles.bookingCard}>
          <h3>Trip Summary</h3>

          <div className={styles.priceRow}>
            <span>Trip Amount</span>
            <span>{formatINR(tripAmount)}</span>
          </div>
          <p className={styles.note}>(This does not include fuel)</p>

          <div className={styles.priceRow}>
            <span>Trip Protection Fee</span>
            <span>+ {formatINR(protectionFee)}</span>
          </div>

          <div className={styles.priceRow}>
            <span>Convenience Fee</span>
            <span>+ {formatINR(convenienceFee)}</span>
          </div>

          <hr />

          <div className={styles.totalRow}>
            <span>Total Price</span>
            <span>{formatINR(totalPrice)}</span>
          </div>

          <div className={styles.priceRow}>
            <span>Refundable Security Deposit</span>
            <span>{formatINR(refundableDeposit)}</span>
          </div>
          <p className={styles.refundNote}>Will be refunded post trip completion (2-3 days)</p>

          <hr />

          <div className={styles.finalAmount}>
            <span>Final Amount</span>
            <span>{formatINR(finalAmount)}</span>
          </div>

          {/* =========================
              LOGIN / BOOK BUTTON LOGIC
          ========================== */}
          <BookButton
            carId={id}
            pickup={pickupRaw}
            returnTime={returnRaw}
            canProceed={pickupDt && returnDt && returnDt > pickupDt}
          />
        </div>
      </div>
    </div>
  );
}

// ---- Book Button (Login-aware) ----
function BookButton({ carId, pickup, returnTime, canProceed }) {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    // check token once
    const checkAuth = () => {
      const token = localStorage.getItem("auth_token");
      if (!token) return setLoggedIn(false);
      try {
        const payload = JSON.parse(
          atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
        );
        const now = Math.floor(Date.now() / 1000);
        setLoggedIn(payload?.exp && payload.exp > now);
      } catch {
        setLoggedIn(false);
      }
    };

    checkAuth();

    // listen for login/logout changes from your existing dispatch
    const handler = () => checkAuth();
    window.addEventListener("auth-change", handler);
    return () => window.removeEventListener("auth-change", handler);
  }, []);

  const handleClick = () => {
    if (!loggedIn) {
      const redirectUrl = encodeURIComponent(
        `/car/${carId}?pickup=${pickup}&return=${returnTime}`
      );
      router.push(`/login?redirect=${redirectUrl}`);
      return;
    }
    if (canProceed) {
      router.push(`/checkout?car=${carId}&pickup=${pickup}&return=${returnTime}`);
    }
  };

  const label = !loggedIn
    ? "Login to Continue"
    : canProceed
    ? "Book Now"
    : "Select Dates to Book";

  const disabled = loggedIn && !canProceed;

  return (
    <button
      className={styles.bookBtn}
      onClick={handleClick}
      disabled={disabled}
      title={!loggedIn ? "Login required" : !canProceed ? "Select pickup and return times" : ""}
    >
      {label}
    </button>
  );
}
