"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { makeAuthenticatedRequest } from "../../lib/customSupabaseClient";
import { testAuth } from "../../lib/authTest";
import styles from "./Checkout.module.css";

/* -------------------------------------------------------------------------- */
/*                          DATE PARSING HELPERS                               */
/* -------------------------------------------------------------------------- */
function parseDateInput(raw) {
  if (!raw) return null;
  try {
    let s = decodeURIComponent(String(raw)).trim();

    if (/^\d+$/.test(s)) {
      const asNum = Number(s);
      return asNum < 1e12 ? new Date(asNum * 1000) : new Date(asNum);
    }

    const native = new Date(s);
    if (!isNaN(native.getTime())) return native;

    const dmy = s.match(
      /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:[T\s]+(\d{1,2}):(\d{2}))?$/
    );
    if (dmy) {
      return new Date(+dmy[3], +dmy[2] - 1, +dmy[1], +(dmy[4] || 0), +(dmy[5] || 0));
    }

    const ymd = s.match(
      /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})(?:[T\s]+(\d{1,2}):(\d{2}))?$/
    );
    if (ymd) {
      return new Date(+ymd[1], +ymd[2] - 1, +ymd[3], +(ymd[4] || 0), +(ymd[5] || 0));
    }

    const alt = new Date(s.replace(/\./g, "-"));
    if (!isNaN(alt.getTime())) return alt;
  } catch (err) {
    console.warn("Date parse error", err);
  }
  return null;
}

function toNumberClean(v) {
  if (v === undefined || v === null) return 0;
  const cleaned = String(v).replace(/[^\d.\-]/g, "");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

/* -------------------------------------------------------------------------- */
/*                             MAIN COMPONENT                                   */
/* -------------------------------------------------------------------------- */
export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const carId = searchParams.get("car");
  const pickup = searchParams.get("pickup");
  const returnTime = searchParams.get("return");
  const plan = searchParams.get("plan") || "BASIC";

  const [car, setCar] = useState(null);
  const [host, setHost] = useState(null);

  const [customer, setCustomer] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
  });

  const [loggedInUser, setLoggedInUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const [priceSummary, setPriceSummary] = useState({
    basePrice: 0,
    gst: 0,
    convFee: 100,
    total: 0,
    hours: 0,
    error: null,
  });

  const [lockStatus, setLockStatus] = useState({
    checking: false,
    error: null,
    lockInfo: null,
    blocked: false,
    canProceed: false
  });

  const [lockTimer, setLockTimer] = useState({
    remaining: 0,
    isActive: false,
    expired: false
  });

  const [bookingCheckStatus, setBookingCheckStatus] = useState({
    checking: false,
    overlaps: false,
    error: null
  });

  /* -------------------------------------------------------------------------- */
  /*                               LOAD RAZORPAY                                */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.Razorpay) {
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.async = true;
      document.body.appendChild(s);
    }
  }, []);

  /* -------------------------------------------------------------------------- */
  /*                             AUTH CHECK (JWT)                                */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.href)}`);
      return;
    }

    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url
        .replace(/-/g, "+")
        .replace(/_/g, "/")
        .padEnd(base64Url.length + (4 - (base64Url.length % 4)) % 4, "=");

      const payload = JSON.parse(atob(base64));
      setLoggedInUser(payload);

      setTimeout(() => testAuth().then(() => {}), 300);
    } catch (err) {
      router.push("/login?redirect=/checkout");
    }
  }, [router]);

  /* -------------------------------------------------------------------------- */
  /*                                FETCH CAR                                    */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    async function go() {
      try {
        const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/vehicles?id=eq.${carId}&select=*,hosts(*),vehicle_images(*)`;

        const r = await fetch(url, {
          headers: {
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            "Content-Type": "application/json",
          },
        });

        const d = await r.json();
        setCar(d[0]);
        setHost(d[0]?.hosts || null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (carId) go();
  }, [carId]);

  /* -------------------------------------------------------------------------- */
  /*                           LOCK COUNTDOWN TIMER                               */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    if (!lockStatus.canProceed || !lockStatus.lockInfo?.expires_at) {
      setLockTimer({ remaining: 0, isActive: false, expired: false });
      return;
    }

    const expiresAt = new Date(lockStatus.lockInfo.expires_at).getTime();
    
    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, expiresAt - now);
      
      setLockTimer({
        remaining,
        isActive: remaining > 0,
        expired: remaining === 0
      });

      // Auto-reload when timer expires
      if (remaining === 0) {
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    };

    // Update immediately
    updateTimer();
    
    // Update every second
    const interval = setInterval(updateTimer, 1000);
    
    return () => clearInterval(interval);
  }, [lockStatus.canProceed, lockStatus.lockInfo]);

  /* -------------------------------------------------------------------------- */
  /*                           FETCH CUSTOMER DATA                               */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    if (!loggedInUser?.sub) return;

    async function go() {
      const res = await makeAuthenticatedRequest(
        "GET",
        `customers?user_id=eq.${loggedInUser.sub}&select=*`
      );

      if (res?.length) {
        const c = res[0];
        setCustomer({
          first_name: c.first_name,
          last_name: c.last_name,
          email: c.email,
          phone: c.phone,
          address: c.address,
        });
      }
    }

    go();
  }, [loggedInUser]);

  /* -------------------------------------------------------------------------- */
  /*                        PRICE CALCULATION (HOURS)                            */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    if (!car) return;

    const start = parseDateInput(pickup);
    const end = parseDateInput(returnTime);

    if (!start || !end) {
      return setPriceSummary({
        basePrice: 0,
        gst: 0,
        convFee: 100,
        total: 0,
        hours: 0,
        error: "Invalid datetime",
      });
    }

    const diffMs = end - start;
    if (diffMs <= 0) {
      return setPriceSummary({
        basePrice: 0,
        gst: 0,
        convFee: 100,
        total: 0,
        hours: 0,
        error: "Return must be after pickup",
      });
    }

    const hours = Math.ceil(diffMs / 3600000);

    const rate =
      plan === "MAX" ? toNumberClean(car.price_max)
      : plan === "PLUS" ? toNumberClean(car.price_plus)
      : toNumberClean(car.price_basic);

    const basePrice = +(hours * rate).toFixed(2);
    const gst = +(basePrice * 0.18).toFixed(2);
    const convFee = 100;
    const total = +(basePrice + gst + convFee).toFixed(2);

    setPriceSummary({
      basePrice,
      gst,
      convFee,
      total,
      hours,
      error: null,
    });
  }, [car, pickup, returnTime, plan]);

  /* -------------------------------------------------------------------------- */
  /*                        SAVE CUSTOMER PROFILE                                */
  /* -------------------------------------------------------------------------- */
  async function handleSave() {
    if (!loggedInUser?.sub) return;

    // Validate required fields
    if (!customer.first_name?.trim() || !customer.last_name?.trim() || 
        !customer.email?.trim() || !customer.address?.trim()) {
      alert("Please fill in all required fields: First Name, Last Name, Email, and Address");
      return;
    }

    const exists = await makeAuthenticatedRequest(
      "GET",
      `customers?user_id=eq.${loggedInUser.sub}&select=id`
    );

    if (exists?.length) {
      await makeAuthenticatedRequest(
        "PATCH",
        `customers?user_id=eq.${loggedInUser.sub}`,
        {
          headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
          body: JSON.stringify(customer),
        }
      );
    } else {
      await makeAuthenticatedRequest("POST", "customers", {
        headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({ ...customer, user_id: loggedInUser.sub }),
      });
    }

    setEditing(false);
  }

  /* -------------------------------------------------------------------------- */
  /*                     CHECK CUSTOMER DATA COMPLETENESS                       */
  /* -------------------------------------------------------------------------- */
  const isCustomerDataComplete = () => {
    return customer.first_name?.trim() && 
           customer.last_name?.trim() && 
           customer.email?.trim() && 
           customer.address?.trim();
  };

  /* -------------------------------------------------------------------------- */
  /*                    CHECK FOR BOOKING OVERLAPS                              */
  /* -------------------------------------------------------------------------- */
  async function checkBookingOverlaps() {
    if (!car?.id) return false;

    setBookingCheckStatus({ checking: true, overlaps: false, error: null });

    try {
      const start = parseDateInput(pickup);
      const end = parseDateInput(returnTime);
      
      if (!start || !end) {
        alert("Invalid date range specified");
        return false;
      }

      const startIso = start.toISOString();
      const endIso = end.toISOString();

      // Check for overlapping confirmed bookings using Supabase REST API
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/bookings?vehicle_id=eq.${car.id}&status=eq.confirmed&select=id,start_time,end_time,pickup_datetime_raw,return_datetime_raw`,
        {
          headers: {
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to check existing bookings');
      }

      const existingBookings = await response.json();
      
      // Check for time overlap using PostgreSQL range logic
      for (const booking of existingBookings) {
        const existingStart = new Date(booking.start_time);
        const existingEnd = new Date(booking.end_time);
        
        // Check if requested time overlaps with existing booking
        // Two time ranges overlap if: start1 < end2 AND start2 < end1
        if (start < existingEnd && existingStart < end) {
          const formatDate = (date) => {
            return date.toLocaleString('en-IN', {
              day: '2-digit',
              month: '2-digit', 
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
          };

          alert(
            `This vehicle is already booked during your requested time.\n\n` +
            `Existing booking:\n` +
            `From: ${formatDate(existingStart)}\n` +
            `To: ${formatDate(existingEnd)}\n\n` +
            `Please choose different dates/times for your booking.`
          );
          setBookingCheckStatus({ checking: false, overlaps: true, error: null });
          return false;
        }
      }

      setBookingCheckStatus({ checking: false, overlaps: false, error: null });
      return true;

    } catch (error) {
      console.error('Booking overlap check error:', error);
      setBookingCheckStatus({ checking: false, overlaps: false, error: "Unable to check availability" });
      alert("Unable to check vehicle availability. Please try again.");
      return false;
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                        CHECK AND CREATE LOCKS                              */
  /* -------------------------------------------------------------------------- */
  async function checkAndCreateLock() {
    if (!loggedInUser?.sub || !car?.id) return false;

    setLockStatus({ checking: true, error: null, lockInfo: null, blocked: false, canProceed: false });

    try {
      // Step 1: Check existing locks
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/locks?vehicle_id=${car.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to check lock status');
      }

      const lockData = await response.json();
      const existingLocks = lockData.locks || [];

      // Step 2: If locks exist, check if they're by current user
      if (existingLocks.length > 0) {
        const userLocks = existingLocks.filter(lock => lock.user_id === loggedInUser.sub);
        const otherUserLocks = existingLocks.filter(lock => lock.user_id !== loggedInUser.sub);

        if (otherUserLocks.length > 0) {
          // Vehicle is locked by another user
          setLockStatus({ 
            checking: false, 
            error: "Someone else is currently booking this car. Try again later.", 
            lockInfo: null, 
            blocked: true, 
            canProceed: false 
          });
          return false;
        }

        if (userLocks.length > 0) {
          // User already has a lock, allow to continue
          setLockStatus({ 
            checking: false, 
            error: null, 
            lockInfo: userLocks[0], 
            blocked: false, 
            canProceed: true 
          });
          return true;
        }
      }

      // Step 3: No locks exist, create new lock
      const start = parseDateInput(pickup);
      const end = parseDateInput(returnTime);
      
      const lockCreateResponse = await fetch('/api/locks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          vehicle_id: car.id,
          start_time: start?.toISOString(),
          end_time: end?.toISOString()
        })
      });

      if (!lockCreateResponse.ok) {
        const errorData = await lockCreateResponse.json();
        if (errorData.locked_by_other) {
          setLockStatus({ 
            checking: false, 
            error: "Someone else is currently booking this car. Try again later.", 
            lockInfo: null, 
            blocked: true, 
            canProceed: false 
          });
          return false;
        }
        throw new Error(errorData.error || 'Failed to create lock');
      }

      const lockResult = await lockCreateResponse.json();
      setLockStatus({ 
        checking: false, 
        error: null, 
        lockInfo: lockResult.lock, 
        blocked: false, 
        canProceed: true 
      });
      return true;

    } catch (error) {
      console.error('Lock check error:', error);
      setLockStatus({ 
        checking: false, 
        error: "Failed to check booking status. Please try again.", 
        lockInfo: null, 
        blocked: false, 
        canProceed: false 
      });
      return false;
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                       CREATE BOOKING AFTER PAYMENT                          */
  /* -------------------------------------------------------------------------- */
  async function createBooking(paymentId) {
    const start = parseDateInput(pickup);
    const end = parseDateInput(returnTime);

    const payload = {
      user_id: loggedInUser.sub,
      vehicle_id: car.id,
      host_id: car.host_id,

      plan,
      hours: priceSummary.hours,

      base_price: priceSummary.basePrice,
      gst: priceSummary.gst,
      conv_fee: priceSummary.convFee,
      total_amount: priceSummary.total,

      payment_id: paymentId,

      pickup_datetime_raw: pickup,
      return_datetime_raw: returnTime,

      start_time: start.toISOString(),
      end_time: end.toISOString(),

      status: "confirmed",
      created_at: new Date().toISOString(),
    };

    // Prevent duplicate bookings
    const dup = await makeAuthenticatedRequest(
      "GET",
      `bookings?payment_id=eq.${paymentId}&select=id`
    );
    if (dup?.length) return dup;

    const res = await makeAuthenticatedRequest("POST", "bookings", {
      headers: { "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify(payload),
    });

    return res;
  }

  /* -------------------------------------------------------------------------- */
  /*                          ENHANCED PAYMENT HANDLER                           */
  /* -------------------------------------------------------------------------- */
  const handlePayment = async () => {
    if (!priceSummary.total) return alert("Invalid amount");

    // Step 1: Check if customer data is complete
    if (!isCustomerDataComplete()) {
      alert("Please fill in all required fields: First Name, Last Name, Email, and Address before proceeding.");
      return;
    }

    // Step 2: Save customer data if editing
    if (editing) {
      await handleSave();
    }

    // Step 3: Check for booking overlaps BEFORE any lock checks
    const noOverlaps = await checkBookingOverlaps();
    if (!noOverlaps) {
      return; // Booking overlaps detected, block payment
    }

    // Step 4: Check and create locks
    const lockCreated = await checkAndCreateLock();
    if (!lockCreated) {
      return; // User is blocked or error occurred
    }

    // Step 5: Proceed with payment
    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: Math.round(priceSummary.total * 100),
      currency: "INR",

      name: "MMmiles Rentals",
      description: `${car.make} ${car.model}`,
      image: "/logo.png",

      handler: async (response) => {
        try {
          const pid = response.razorpay_payment_id;
          alert("Payment Success! Saving booking...");

          const booking = await createBooking(pid);

          const bookingId = Array.isArray(booking)
            ? booking[0]?.id
            : booking?.id;

          // Step 6: Handle booking completion (buffer time, lock conversion)
          try {
            await fetch('/api/booking-complete', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem("auth_token")}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                vehicle_id: car.id,
                booking_id: bookingId,
                payment_id: pid
              })
            });
          } catch (completionError) {
            console.warn('Booking completion handler failed, but payment was successful:', completionError);
          }

          router.push(
            bookingId
              ? `/booking-success?booking=${bookingId}`
              : `/booking-success`
          );
        } catch (err) {
          console.error(err);
          alert("Payment succeeded but booking failed.");
        }
      },

      prefill: {
        name: `${customer.first_name} ${customer.last_name}`,
        email: customer.email,
        contact: customer.phone,
      },
    };

    new window.Razorpay(options).open();
  };

  /* -------------------------------------------------------------------------- */
  /*                                   UI                                        */
  /* -------------------------------------------------------------------------- */

  if (loading) return <p className={styles.loading}>Loading...</p>;
  if (!car) return <p className={styles.error}>Car Not Found</p>;

  // Format time remaining
  const formatTimeRemaining = (ms) => {
    if (ms <= 0) return "00:00";
    
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Check if time is running low (less than 5 minutes)
  const isTimeRunningLow = (ms) => {
    return ms > 0 && ms < 5 * 60 * 1000; // Less than 5 minutes
  };

  return (
    <div className={styles.checkoutContainer}>
      {/* LOCK COUNTDOWN TIMER */}
      {lockTimer.isActive && (
        <div className={`${styles.lockTimer} ${isTimeRunningLow(lockTimer.remaining) ? styles.lockTimerWarning : ''}`}>
          <div className={styles.timerContent}>
            <span className={styles.timerLabel}>⏰</span>
            <span className={styles.timerText}>
              Lock expires in: {formatTimeRemaining(lockTimer.remaining)}
            </span>
            <span className={styles.timerLabel}>⏰</span>
          </div>
        </div>
      )}

      {/* EXPIRED LOCK MESSAGE */}
      {lockTimer.expired && (
        <div className={styles.expiredLockMessage}>
          <div className={styles.expiredContent}>
            <span>🔒 Lock expired! Refreshing page...</span>
          </div>
        </div>
      )}
      <div className={styles.leftColumn}>
        {/* CAR CARD */}
        <div className={styles.carCard}>
          <Image
            src={car.vehicle_images?.[0]?.image_url || "/cars/default.jpg"}
            width={400}
            height={250}
            alt="Car"
            className={styles.carImage}
          />
          <div className={styles.carDetails}>
            <h2>{car.make} {car.model} ({car.model_year})</h2>
            <p>Hosted by <strong>{host?.full_name}</strong></p>
            <p>📍 {car.location_name}, {car.city}</p>
          </div>
        </div>

        {/* CUSTOMER FORM */}
        <div className={styles.formSection}>
          <h3>Your Details</h3>
          
          {/* Customer Data Validation */}
          {!isCustomerDataComplete() && (
            <div style={{ 
              background: '#fff3cd', 
              color: '#856404', 
              padding: '10px', 
              borderRadius: '4px', 
              marginBottom: '15px',
              border: '1px solid #ffeaa7'
            }}>
              <strong>Please complete your profile:</strong> First Name, Last Name, Email, and Address are required to proceed with booking.
            </div>
          )}

          {["first_name", "last_name", "email"].map((field) => (
            <div className={styles.formGroup} key={field}>
              <label>{field.replace("_", " ").toUpperCase()} *</label>
              <input
                type="text"
                value={customer[field]}
                onChange={(e) => {
                  setCustomer({ ...customer, [field]: e.target.value });
                  setEditing(true);
                }}
                placeholder={field === "email" ? "your.email@example.com" : ""}
                style={{
                  borderColor: !customer[field]?.trim() && !isCustomerDataComplete() ? '#dc3545' : '#ddd'
                }}
              />
            </div>
          ))}

          <div className={styles.formGroup}>
            <label>Home Address *</label>
            <textarea
              rows="3"
              value={customer.address}
              onChange={(e) => {
                setCustomer({ ...customer, address: e.target.value });
                setEditing(true);
              }}
              placeholder="Enter your complete address including city and state"
              style={{
                borderColor: !customer.address?.trim() && !isCustomerDataComplete() ? '#dc3545' : '#ddd'
              }}
            />
          </div>

          <button
            className={styles.saveBtn}
            disabled={!editing || !customer.first_name?.trim() || !customer.last_name?.trim() || !customer.email?.trim() || !customer.address?.trim()}
            onClick={handleSave}
          >
            {editing ? "Save Changes" : "Saved ✓"}
          </button>
        </div>

        {/* BOOKING OVERLAP STATUS */}
        {bookingCheckStatus.checking && (
          <div className={styles.formSection}>
            <div style={{ 
              background: '#cce5ff', 
              color: '#004085', 
              padding: '10px', 
              borderRadius: '4px', 
              border: '1px solid #b3d9ff'
            }}>
              📅 Checking vehicle availability against existing bookings...
            </div>
          </div>
        )}

        {bookingCheckStatus.overlaps && (
          <div className={styles.formSection}>
            <div style={{ 
              background: '#f8d7da', 
              color: '#721c24', 
              padding: '15px', 
              borderRadius: '4px', 
              border: '1px solid #f5c6cb',
              textAlign: 'center'
            }}>
              <strong>📅 Booking Conflict Detected</strong><br />
              This vehicle has confirmed bookings that overlap with your requested time. Please choose different dates/times.
            </div>
          </div>
        )}

        {/* LOCK STATUS */}
        {lockStatus.checking && (
          <div className={styles.formSection}>
            <div style={{ 
              background: '#cce5ff', 
              color: '#004085', 
              padding: '10px', 
              borderRadius: '4px', 
              border: '1px solid #b3d9ff'
            }}>
              🔄 Checking vehicle availability...
            </div>
          </div>
        )}

        {lockStatus.blocked && lockStatus.error && (
          <div className={styles.formSection}>
            <div style={{ 
              background: '#f8d7da', 
              color: '#721c24', 
              padding: '15px', 
              borderRadius: '4px', 
              border: '1px solid #f5c6cb',
              textAlign: 'center'
            }}>
              <strong>⚠️ Booking Unavailable</strong><br />
              {lockStatus.error}
            </div>
          </div>
        )}

        {lockStatus.canProceed && lockStatus.lockInfo && (
          <div className={styles.formSection}>
            <div style={{ 
              background: '#d4edda', 
              color: '#155724', 
              padding: '10px', 
              borderRadius: '4px', 
              border: '1px solid #c3e6cb'
            }}>
              ✅ Vehicle reserved for 30 minutes. Complete your payment to confirm the booking.
            </div>
          </div>
        )}
      </div>

      {/* PRICE / SUMMARY */}
      <div className={styles.priceSection}>
        <h3>Trip Summary</h3>

        <p><strong>Plan:</strong> {plan}</p>
        <p><strong>Pickup:</strong> {pickup}</p>
        <p><strong>Return:</strong> {returnTime}</p>

        {priceSummary.error && (
          <p style={{ color: "red" }}>{priceSummary.error}</p>
        )}

        <p><strong>Duration:</strong> {priceSummary.hours} hours</p>

        <div className={styles.priceBreakdown}>
          <p>Base Price: ₹{priceSummary.basePrice}</p>
          <p>Convenience Fee: ₹{priceSummary.convFee}</p>
          <p>GST (18%): ₹{priceSummary.gst}</p>
          <hr />
          <h4>Total: ₹{priceSummary.total}</h4>
        </div>

        <button 
          className={styles.payBtn} 
          onClick={handlePayment}
          disabled={
            !priceSummary.total || 
            !isCustomerDataComplete() || 
            bookingCheckStatus.checking ||
            bookingCheckStatus.overlaps ||
            lockStatus.checking ||
            lockStatus.blocked ||
            (editing && (!customer.first_name?.trim() || !customer.last_name?.trim() || !customer.email?.trim() || !customer.address?.trim()))
          }
        >
          {bookingCheckStatus.checking ? (
            "Checking Availability..."
          ) : bookingCheckStatus.overlaps ? (
            "Time Conflict"
          ) : lockStatus.checking ? (
            "Checking Lock Status..."
          ) : lockStatus.blocked ? (
            "Currently Unavailable"
          ) : !isCustomerDataComplete() ? (
            "Complete Profile Required"
          ) : lockStatus.canProceed ? (
            "Pay Now ✓"
          ) : (
            "Pay Now"
          )}
        </button>
      </div>
    </div>
  );
}
