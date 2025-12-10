"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { makeAuthenticatedRequest } from "../../lib/customSupabaseClient";
import { testAuth } from "../../lib/authTest";
import { parseDate, formatDateTimeForDB, parseBookingRawDateTime } from "../../lib/dateUtils";
import styles from "./EnhancedCheckout.module.css";

// Supabase storage base URL for car images
const STORAGE_BASE_URL = "https://tktfsjtlfjxbqfvbcoqr.supabase.co/storage/v1/object/public/car-images/";

// Helper to get full image URL
const getFullImageUrl = (imageUrl) => {
  if (!imageUrl) return "/cars/default.jpg";
  return imageUrl.startsWith("http") ? imageUrl : `${STORAGE_BASE_URL}${imageUrl}`;
};

// Helper to get primary image URL from vehicle
const getPrimaryImageUrl = (car) => {
  const images = car?.vehicle_images || [];
  const primaryImage = images.find((img) => img.is_primary) || images[0];
  return primaryImage?.image_url ? getFullImageUrl(primaryImage.image_url) : "/cars/default.jpg";
};

/* -------------------------------------------------------------------------- */
/*                          DATE PARSING HELPERS                               */
/* -------------------------------------------------------------------------- */
// Using centralized date parsing from dateUtils
function parseDateInput(raw) {
  return parseDate(raw);
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
export default function EnhancedCheckoutPage() {
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
  const [agree, setAgree] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponInfo, setCouponInfo] = useState(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState(new Set());

  const [priceSummary, setPriceSummary] = useState({
    rentalCost: 0,
    insuranceCost: 0,
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

      setTimeout(() => testAuth().then(() => { }), 300);
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

      if (remaining === 0) {
        window.location.reload();
      }
    };

    updateTimer();
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
        rentalCost: 0,
        insuranceCost: 0,
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
        rentalCost: 0,
        insuranceCost: 0,
        basePrice: 0,
        gst: 0,
        convFee: 100,
        total: 0,
        hours: 0,
        error: "Return must be after pickup",
      });
    }

    const hours = Math.ceil(diffMs / 3600000);
    const hourlyRate = toNumberClean(car.hourly_rate);
    const insuranceCost =
      plan === "MAX" ? toNumberClean(car.price_max)
        : plan === "PLUS" ? toNumberClean(car.price_plus)
          : toNumberClean(car.price_basic);

    const rentalCost = +(hours * hourlyRate).toFixed(2);
    const basePrice = +(rentalCost + insuranceCost).toFixed(2);
    const gst = +(basePrice * 0.18).toFixed(2);
    const convFee = 100;
    const subtotal = +(basePrice + gst + convFee).toFixed(2);

    // Apply discount if any
    const totalAfterDiscount = +(subtotal - discount).toFixed(2);

    setPriceSummary({
      rentalCost,
      insuranceCost,
      basePrice,
      gst,
      convFee,
      total: Math.max(0, totalAfterDiscount),
      hours,
      error: null,
    });
  }, [car, pickup, returnTime, plan, discount]);

  /* -------------------------------------------------------------------------- */
  /*                        SAVE CUSTOMER PROFILE                                */
  /* -------------------------------------------------------------------------- */
  async function handleSave() {
    if (!loggedInUser?.sub) return;

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
  /*                    CHECK FOR BOOKING OVERLAPS                              */
  /* -------------------------------------------------------------------------- */
  async function checkBookingOverlaps() {
    console.log('🔍 checkBookingOverlaps called', { carId: car?.id, pickup, returnTime });
    
    if (!car?.id) {
      console.log('❌ No car ID found');
      return false;
    }

    setBookingCheckStatus({ checking: true, overlaps: false, error: null });

    try {
      const start = parseBookingRawDateTime(pickup);
      const end = parseBookingRawDateTime(returnTime);
      
      console.log('📅 Parsed dates:', { 
        pickupRaw: pickup, 
        returnRaw: returnTime,
        start: start?.toISOString(),
        end: end?.toISOString()
      });

      if (!start || !end) {
        alert("Invalid date range specified");
        return false;
      }

      const startIso = formatDateTimeForDB(start);
      const endIso = formatDateTimeForDB(end);
      
      console.log('🗄️ Fetching existing bookings for vehicle:', car.id);

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
      console.log('📋 Existing bookings found:', existingBookings.length, existingBookings);
      
      // Check for time overlap using PostgreSQL range logic
      for (const booking of existingBookings) {
        const existingStart = new Date(booking.start_time);
        const existingEnd = new Date(booking.end_time);
        
        console.log('⏰ Checking overlap with booking:', {
          bookingId: booking.id,
          existingStart: existingStart.toISOString(),
          existingEnd: existingEnd.toISOString(),
          requestedStart: start.toISOString(),
          requestedEnd: end.toISOString(),
          startTime: start.getTime(),
          endTime: end.getTime(),
          existingStartTime: existingStart.getTime(),
          existingEndTime: existingEnd.getTime(),
          condition1: `start < existingEnd: ${start.toISOString()} < ${existingEnd.toISOString()} = ${start < existingEnd}`,
          condition2: `existingStart < end: ${existingStart.toISOString()} < ${end.toISOString()} = ${existingStart < end}`,
          overlapCheck: `start < existingEnd: ${start < existingEnd}, existingStart < end: ${existingStart < end}`
        });
        
        // Two time ranges overlap if: start1 < end2 AND start2 < end1
        const condition1 = start < existingEnd;
        const condition2 = existingStart < end;
        
        console.log('🔍 Detailed overlap analysis:', {
          bookingId: booking.id,
          willOverlap: condition1 && condition2,
          condition1: `${condition1} (${start.toISOString()} < ${existingEnd.toISOString()})`,
          condition2: `${condition2} (${existingStart.toISOString()} < ${end.toISOString()})`
        });
        
        if (condition1 && condition2) {
          console.log('🚫 OVERLAP DETECTED! Blocking payment');
          
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

      console.log('✅ No overlaps found - allowing payment');
      setBookingCheckStatus({ checking: false, overlaps: false, error: null });
      return true;

    } catch (error) {
      console.error('❌ Booking overlap check error:', error);
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

      if (existingLocks.length > 0) {
        const userLocks = existingLocks.filter(lock => lock.user_id === loggedInUser.sub);
        const otherUserLocks = existingLocks.filter(lock => lock.user_id !== loggedInUser.sub);

        if (otherUserLocks.length > 0) {
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
          try {
            const extendResponse = await fetch('/api/locks', {
              method: 'PATCH',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                vehicle_id: car.id
              })
            });

            if (extendResponse.ok) {
              const extendData = await extendResponse.json();
              setLockStatus({
                checking: false,
                error: null,
                lockInfo: extendData.lock,
                blocked: false,
                canProceed: true
              });
              return true;
            } else {
              setLockStatus({
                checking: false,
                error: null,
                lockInfo: userLocks[0],
                blocked: false,
                canProceed: true
              });
              return true;
            }
          } catch (extendError) {
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
      }

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
          start_time: formatDateTimeForDB(start),
          end_time: formatDateTimeForDB(end)
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
    // Use the new parsing function to ensure consistent DD/MM/YYYY interpretation
    const start = parseBookingRawDateTime(pickup);
    const end = parseBookingRawDateTime(returnTime);

    // Validate parsed dates
    if (!start || !end) {
      console.error("Failed to parse booking dates:", { pickup, returnTime });
      throw new Error("Invalid booking dates");
    }

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
      start_time: formatDateTimeForDB(start),
      end_time: formatDateTimeForDB(end),
      status: "confirmed",
      created_at: formatDateTimeForDB(new Date()),
    };

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
    if (!agree) return alert("Please accept terms and conditions");

    if (!customer.first_name?.trim() || !customer.last_name?.trim() ||
      !customer.email?.trim() || !customer.address?.trim()) {
      alert("Please fill in all required fields: First Name, Last Name, Email, and Address before proceeding.");
      return;
    }

    if (editing) {
      await handleSave();
    }

    console.log('🚀 Starting booking overlap check...', { pickup, returnTime, carId: car?.id });
    
    const noOverlaps = await checkBookingOverlaps();
    console.log('📋 Booking overlap check result:', noOverlaps);
    
    if (!noOverlaps) {
      console.log('❌ Booking overlaps detected - blocking payment');
      return; // Booking overlaps detected, block payment
    }

    console.log('✅ No booking overlaps - proceeding to lock check');
    const lockCreated = await checkAndCreateLock();
    if (!lockCreated) {
      return; // User is blocked or error occurred
    }

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

          // Mark step 3 as complete when payment is successful
          setCompletedSteps(prev => new Set([...prev, 3]));

          const booking = await createBooking(pid);

          const bookingId = Array.isArray(booking)
            ? booking[0]?.id
            : booking?.id;

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

  const formatTimeRemaining = (ms) => {
    if (ms <= 0) return "00:00";

    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);

    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const isTimeRunningLow = (ms) => {
    return ms > 0 && ms < 5 * 60 * 1000;
  };

  const isCustomerDataComplete = () => {
    return customer.first_name?.trim() &&
      customer.last_name?.trim() &&
      customer.email?.trim() &&
      customer.address?.trim();
  };

  const handleStep1Next = async () => {
    if (!isCustomerDataComplete()) {
      alert("Please fill in all required fields: First Name, Last Name, Email, and Address before proceeding.");
      return;
    }

    if (editing) {
      await handleSave();
    }

    setCompletedSteps(prev => new Set([...prev, 1]));
    setCurrentStep(2);
  };

  const handleStep2Next = async () => {
    if (!agree) {
      alert("Please agree to the Cancellation Policy and Terms of Service before proceeding.");
      return;
    }

    // Mark step 2 as complete and proceed to payment
    setCompletedSteps(prev => new Set([...prev, 2]));
    setCurrentStep(3);
  };

  const handleBackToStep = (step) => {
    setCurrentStep(step);
    // Keep completed steps but allow going back
  };

  return (
    <div className={styles.pageWrap}>
      {/* PAYMENT WINDOW COUNTDOWN TIMER */}
      {lockTimer.isActive && (
        <div className={`${styles.lockTimer} ${isTimeRunningLow(lockTimer.remaining) ? styles.lockTimerWarning : ''}`}>
          <div className={styles.timerContent}>
            <span className={styles.timerLabel}>⏱️</span>
            <span className={styles.timerText}>
              Pay within {formatTimeRemaining(lockTimer.remaining)}
            </span>
            <span className={styles.timerLabel}>⏱️</span>
          </div>
        </div>
      )}

      {/* Stepper */}
      <div className={styles.stepper}>
        <div
          className={styles.stepItem}
          onClick={() => currentStep === 1 ? null : handleBackToStep(1)}
          style={{ cursor: currentStep === 1 ? 'default' : 'pointer' }}
        >
          <div className={`${styles.stepCircle} ${completedSteps.has(1) ? styles.stepDone :
            currentStep === 1 ? styles.stepActive :
              styles.stepInactive
            }`}>
            {completedSteps.has(1) ? '✔' : '1'}
          </div>
          <div className={styles.stepLabel}>Passenger Details</div>
        </div>

        <div className={styles.stepLine} />

        <div
          className={styles.stepItem}
          onClick={() => currentStep <= 2 || !completedSteps.has(1) ? null : handleBackToStep(2)}
          style={{ cursor: currentStep <= 2 || !completedSteps.has(1) ? 'default' : 'pointer' }}
        >
          <div className={`${styles.stepCircle} ${completedSteps.has(2) ? styles.stepDone :
            currentStep === 2 ? styles.stepActive :
              styles.stepInactive
            }`}>
            {completedSteps.has(2) ? '✔' : '2'}
          </div>
          <div className={styles.stepLabel}>Review Journey</div>
        </div>

        <div className={styles.stepLine} />

        <div
          className={styles.stepItem}
          onClick={() => currentStep <= 3 || !completedSteps.has(2) ? null : handleBackToStep(3)}
          style={{ cursor: currentStep <= 3 || !completedSteps.has(2) ? 'default' : 'pointer' }}
        >
          <div className={`${styles.stepCircle} ${completedSteps.has(3) ? styles.stepDone :
            currentStep === 3 ? styles.stepActive :
              styles.stepInactive
            }`}>
            {completedSteps.has(3) ? '✔' : '3'}
          </div>
          <div className={styles.stepLabel}>Payment</div>
        </div>
      </div>

      {/* STEP 1: Passenger Details */}
      {currentStep === 1 && (
        <div className={styles.mainGrid}>
          <div className={styles.leftCol}>
            <div className={styles.formSection}>
              <h3>Your Details</h3>

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
                disabled={!editing || !isCustomerDataComplete()}
                onClick={handleSave}
              >
                {editing ? "Save Changes" : "Saved ✓"}
              </button>

              <button
                className={styles.stepNextBtn}
                disabled={!isCustomerDataComplete()}
                onClick={handleStep1Next}
              >
                Next: Review Journey →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Review Journey - Using Reference Design */}
      {currentStep === 2 && (
        <div className={styles.mainGrid}>
          {/* LEFT COLUMN */}
          <div className={styles.leftCol}>
            <div className={styles.carCard}>
              <div className={styles.carImageStage}>
                <Image
                  src={getPrimaryImageUrl(car)}
                  alt={`${car.make} ${car.model}`}
                  width={400}
                  height={320}
                  className={styles.carImage}
                  priority
                />
                <div className={styles.groundSpot} />
              </div>

              <div className={styles.carMeta}>
                <h1 className={styles.title}>{car.make.toUpperCase()} {car.model.toUpperCase()}</h1>

                <div className={styles.features}>
                  <span>✔ Serviced</span>
                  <span>✔ {car.seating_capacity} Seat</span>
                  <span>✔ {car.transmission_type}</span>
                </div>
                <div className={styles.features}>
                  <span>✔ {car.model_year} model</span>
                  <span>✔ good tyre condition</span>
                </div>
                <div className={styles.features}>
                  <span>✔ Insurance covered</span>
                  <span>✔ Luggage space</span>
                </div>

                <div className={styles.priceRow}>
                  <div className={styles.price}>Rs.{priceSummary.total} <span className={styles.priceper}>For {priceSummary.hours}hours</span></div>
                </div>
              </div>
            </div>

            <div className={styles.infoRow}>
              <div className={styles.infoCard}>
                <h3>Inclusion / Exclusions</h3>
                <ul className={styles.infoList}>
                  <p><span className={styles.infoListicon}>✖</span> Fuel not included. Guest should return the car with the same fuel level as at start.</p>
                  <p><span className={styles.infoListicon}>✖</span> Toll/Fastag charges not included. Check with host for Fastag recharge.</p>
                  <p><span className={styles.infoListicon}>✖</span> Trip Protection excludes: Off-road use, driving under influence, over-speeding, illegal use, restricted zones.</p>
                  <p><span className={styles.infoListicongreen}>✔</span> You need to carry ID proof while starting the Drive for Host verification.</p>
                </ul>
              </div>

              <div className={styles.infoCard}>
                <h3>Cancellation</h3>
                <p className={styles.small}>50% of trip amount or INR 4000 (whichever is lower)</p>
                <p className={styles.smallMuted}>Until 19 Nov 2025, 07:00 PM · Convenience fee is non refundable</p>

                <div className={styles.refundLabel}>Refund upon cancellation</div>
                <div className={styles.refundBar}>
                  <div className={styles.refundFill}></div>
                  <div className={styles.refundEmpty}></div>
                </div>

                <div className={styles.refundTime}>50% Refund before Nov 19 • 07:00 PM</div>
                <p className={styles.refundTimebelow}><b>Important</b><span className={styles.refundTimebelowstar}>*</span> :(MMMiles may revise the cancellation policy to align with the regulations of each city.)</p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <aside className={styles.rightCol}>
            <div className={styles.summaryCard}>
              <h2 className={styles.summaryTitle}>Trip Summary</h2>

              <div className={styles.summaryRow}>
                <div className={styles.rowLabel}>Duration:</div>
                <div className={styles.rowValue}>{priceSummary.hours} hours</div>
              </div>

              <div className={styles.summaryRow}>
                <div className={styles.rowLabel}>Rental ({priceSummary.hours} hrs × ₹{car?.hourly_rate || 0}/hr):</div>
                <div className={styles.rowValue}>₹{priceSummary.rentalCost}</div>
              </div>

              <div className={styles.summaryRow}>
                <div className={styles.rowLabel}>Insurance ({plan} Plan):</div>
                <div className={styles.rowValue}>₹{priceSummary.insuranceCost}</div>
              </div>

              <div className={styles.summaryRow}>
                <div className={styles.rowLabel}>Convenience Fee:</div>
                <div className={styles.rowValue}>₹{priceSummary.convFee}</div>
              </div>

              <div className={styles.summaryRow}>
                <div className={styles.rowLabel}>GST (18%):</div>
                <div className={styles.rowValue}>₹{priceSummary.gst}</div>
              </div>

              {discount > 0 && (
                <div className={styles.summaryRow}>
                  <div className={styles.rowLabel}>Discount Applied:</div>
                  <div className={styles.rowValue}>-₹{discount}</div>
                </div>
              )}

              <div className={styles.divider} />

              <div className={styles.totalRow}>
                <div className={styles.totalLabel}>Apply coupons:</div>
                <div className={styles.totalValue}>enter code</div>
              </div>

              <div className={styles.totalBar}>
                <div className={styles.totalText}>Total:</div>
                <div className={styles.totalAmt}>₹{priceSummary.total}</div>
              </div>

              <button
                className={styles.payBtn}
                disabled={!agree}
                title={!agree ? "Please accept terms & conditions" : "Proceed to Payment"}
                onClick={handleStep2Next}
              >
                Next: Payment →
              </button>
            </div>

            {/* Terms strip below right card */}
            <div className={styles.termsStrip}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  className={styles.checkbox}
                />
                <span>
                  By proceeding, I confirm that I agree to the{" "}
                  <a href="#" className={styles.link}>Cancellation Policy</a> and{" "}
                  <a href="#" className={styles.link}>Terms of Service</a>.
                </span>
              </label>
            </div>
          </aside>
        </div>
      )}

      {/* STEP 3: Payment */}
      {currentStep === 3 && (
        <div className={styles.paymentSection}>
          <div className={styles.paymentCard}>
            <h2>Payment Details</h2>

            <div className={styles.paymentSummary}>
              <div className={styles.summaryRow}>
                <div className={styles.rowLabel}>Total Amount:</div>
                <div className={styles.rowValue}>₹{priceSummary.total}</div>
              </div>
            </div>

            <button
              className={styles.payBtn}
              disabled={
                !priceSummary.total ||
                bookingCheckStatus.checking ||
                bookingCheckStatus.overlaps ||
                lockStatus.checking ||
                lockStatus.blocked
              }
              onClick={() => {
                console.log('💳 Payment button clicked!', {
                  priceSummary: priceSummary.total,
                  bookingCheckStatus,
                  lockStatus,
                  disabled: !priceSummary.total ||
                    bookingCheckStatus.checking ||
                    bookingCheckStatus.overlaps ||
                    lockStatus.checking ||
                    lockStatus.blocked
                });
                handlePayment();
              }}
            >
              {bookingCheckStatus.checking ? (
                "Checking Availability..."
              ) : bookingCheckStatus.overlaps ? (
                "Time Conflict"
              ) : lockStatus.checking ? (
                "Checking Lock Status..."
              ) : lockStatus.blocked ? (
                "Currently Unavailable"
              ) : lockStatus.canProceed ? (
                `Pay ₹${priceSummary.total} ✓`
              ) : (
                `Pay ₹${priceSummary.total}`
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}