"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { toast } from "react-hot-toast";
import {
  UserIcon,
  CogIcon,
  CalendarIcon,
  InformationCircleIcon,
  LockClosedIcon
} from "@heroicons/react/24/solid";
import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";
import { makeAuthenticatedRequest } from "../../lib/customSupabaseClient";
import { parseDate, formatDateTimeForDB, parseBookingRawDateTime } from "../../lib/dateUtils";
import styles from "./EnhancedCheckout.module.css";

// Enforce Chennai/Coimbatore-only logic
function useCityEnforcement() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const city = searchParams.get("city");
    if (city && city !== "Chennai" && city !== "Coimbatore") {
      router.push(`/comingsoon?city=${encodeURIComponent(city)}`);
    }
  }, [searchParams, router]);
}

// Helper to format duration
const formatDuration = (totalHours) => {
  if (!totalHours) return "0 Hours";
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const bufferHours = 3;

  if (days > 0) {
    return `${days} Day${days > 1 ? 's' : ''} ${hours > 0 ? ` ${hours} Hour${hours > 1 ? 's' : ''}` : ''}`;
  }
  return `${hours} Hour${hours > 1 ? 's' : ''}`;
};

// Supabase storage base URL for car images
const STORAGE_BASE_URL = "/api/sb/storage/v1/object/public/car-images/";

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
  useCityEnforcement();
  const router = useRouter();
  const searchParams = useSearchParams();

  const carId = searchParams.get("car");
  const pickup = searchParams.get("pickup");
  const returnTime = searchParams.get("return");
  // Plan parameter is no longer needed - insurance is calculated automatically

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
    serverCalculated: false,
  });

  const [orderDetails, setOrderDetails] = useState({
    orderId: null,
    amount: 0,
    key: null,
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

  const [unavailableData, setUnavailableData] = useState(null);

  const [bookingResult, setBookingResult] = useState({
    show: false,
    type: null, // 'success', 'processing', 'failed'
    title: '',
    message: '',
    bookingId: null,
    paymentId: null
  });

  const [publicCoupons, setPublicCoupons] = useState([]);
  const [showCouponDropdown, setShowCouponDropdown] = useState(false);
  const [couponFeedback, setCouponFeedback] = useState({
    show: false,
    type: null, // 'success', 'removed', 'error'
    message: '',
    discount: 0
  });

  /* -------------------------------------------------------------------------- */
  /*                            REDIRECT LOGIC                                   */
  /* -------------------------------------------------------------------------- */
  const handleRedirect = () => {
    // Try to get previous search parameters to preserve location
    const saved = sessionStorage.getItem("lastSearchParams");
    const params = new URLSearchParams(saved || "");

    // Update with current query dates if available
    if (pickup) params.set("pickupTime", pickup);
    if (returnTime) params.set("returnTime", returnTime);

    // If no location data, default to Chennai (or handle gracefully)
    if (!params.get("lat") || !params.get("lon")) {
      params.set("city", "Chennai"); // Default fallback
    }

    router.push(`/search?${params.toString()}`);
  };

  /* -------------------------------------------------------------------------- */
  /*                       TIMER COMPONENT                                      */
  /* -------------------------------------------------------------------------- */
  function UnavailabilityTimer({ duration = 5, onComplete }) {
    const [timeLeft, setTimeLeft] = useState(duration);

    useEffect(() => {
      if (timeLeft <= 0) {
        onComplete();
        return;
      }
      const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
      return () => clearInterval(timer);
    }, [timeLeft, onComplete]);

    const radius = 26;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (timeLeft / duration) * circumference;

    return (
      <div className={styles.timerRing}>
        <svg className={styles.timerSvg}>
          <circle cx="30" cy="30" r={radius} className={styles.timerCircleBg} />
          <circle
            cx="30" cy="30" r={radius}
            className={styles.timerCircleFg}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <span className={styles.timerTextCentered}>{timeLeft}</span>
      </div>
    );
  }

  /* -------------------------------------------------------------------------- */
  /*                                LOAD RAZORPAY                                */
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
  /*                         AUTH CHECK (SESSION COOKIE)                          */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    let active = true;

    const checkSession = async () => {
      try {
        const response = await fetch("/api/auth/session", {
          credentials: "include",
          cache: "no-store",
        });
        const session = response.ok ? await response.json() : null;

        if (!active) return;

        if (!session?.authenticated || !session.user?.id) {
          router.push(`/login?redirect=${encodeURIComponent(window.location.href)}`);
          return;
        }

        setLoggedInUser({
          sub: session.user.id,
          phone_number: session.user.phone || "",
          email: session.user.email || "",
        });
      } catch (err) {
        if (active) {
          router.push(`/login?redirect=${encodeURIComponent(window.location.href)}`);
        }
      }
    };

    checkSession();
    return () => {
      active = false;
    };
  }, [router]);

  /* -------------------------------------------------------------------------- */
  /*                                FETCH CAR                                    */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    async function go() {
      try {
        const supabaseBase = typeof window !== 'undefined' ? '/api/sb' : process.env.NEXT_PUBLIC_SUPABASE_URL;
        const url = `${supabaseBase}/rest/v1/vehicles?id=eq.${carId}&select=*,hosts(*),vehicle_images(*)`;

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
  /*                             FETCH PUBLIC COUPONS                             */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    async function fetchCoupons() {
      if (!loggedInUser?.sub) return;
      try {
        const now = new Date().toISOString();
        const response = await fetch(
          `${typeof window !== 'undefined' ? '/api/sb' : process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/coupons?is_active=eq.true&is_admin_coupon=eq.false&valid_until=gt.${now}&select=*`,
          {
            headers: {
              apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const allCoupons = await response.json() || [];

          // 1. Fetch user's past bookings to determine coupon eligibility
          const { data: pastBookings, error } = await makeAuthenticatedRequest(
            "GET",
            `bookings?user_id=eq.${loggedInUser.sub}&status=in.(confirmed,completed)&select=id,applied_coupon`
          ).then(data => ({ data, error: null })).catch(e => ({ data: null, error: e }));

          let pastCouponsUsedCount = 0;
          let pastUsedCodes = [];

          if (!error && pastBookings) {
            pastCouponsUsedCount = pastBookings.filter(b => b.applied_coupon !== null).length;
            pastUsedCodes = pastBookings.map(b => b.applied_coupon).filter(Boolean);
          }

          // 2. Filter the coupons based on sequence and single-use rules
          const filteredCoupons = allCoupons.filter(coupon => {
            // A. Single use check
            if (coupon.is_single_use && pastUsedCodes.includes(coupon.code)) {
              return false;
            }
            // B. Sequence check
            const reqCount = coupon.required_previous_coupons_used;
            if (reqCount !== undefined && reqCount !== null && reqCount >= 0) {
              if (pastCouponsUsedCount !== reqCount) {
                return false;
              }
            }
            return true;
          });

          setPublicCoupons(filteredCoupons);
        }
      } catch (err) {
        console.error("Failed to fetch coupons:", err);
      }
    }
    fetchCoupons();
  }, [loggedInUser]);

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
        // Instead of reload, maybe show unavailable?
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
          first_name: c.first_name || "",
          last_name: c.last_name || "",
          email: c.email || "",
          phone: c.phone || loggedInUser.phone_number || "",
          address: c.address || "",
        });
      } else {
        // If no customer record exists, pre-fill phone from token
        setCustomer((prev) => ({
          ...prev,
          phone: loggedInUser.phone_number || "",
        }));
      }
    }

    go();
  }, [loggedInUser]);

  /* -------------------------------------------------------------------------- */
  /*                    SERVER-SIDE PRICE CALCULATION                            */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    if (!car || !pickup || !returnTime) return;

    // First validate that the dates can be parsed
    const pickupDate = parseDateInput(pickup);
    const returnDate = parseDateInput(returnTime);

    if (!pickupDate || !returnDate) {
      console.error('❌ Invalid dates in URL parameters:', { pickup, returnTime });
      setPriceSummary({
        rentalCost: 0,
        insuranceCost: 0,
        basePrice: 0,
        gst: 0,
        convFee: 100,
        total: 0,
        hours: 0,
        error: "Invalid booking dates. Please select valid pickup and return times.",
        serverCalculated: false,
      });
      return;
    }

    // --- Validation Logic ---
    const now = new Date();
    // Allow a small buffer (e.g., 5 mins) for "past" checks
    const pastBuffer = 5 * 60 * 1000;

    if (pickupDate < new Date(now.getTime() - pastBuffer)) {
      setPriceSummary({
        rentalCost: 0,
        insuranceCost: 0,
        basePrice: 0,
        gst: 0,
        convFee: 100,
        total: 0,
        hours: 0,
        error: "Pickup time cannot be in the past.",
        serverCalculated: false,
      });
      toast.error("Pickup time cannot be in the past.");
      setTimeout(() => router.push('/'), 2500);
      return;
    }

    const durationMs = returnDate - pickupDate;
    const minDurationMs = 6 * 60 * 60 * 1000; // 6 hours

    if (durationMs < minDurationMs) {
      setPriceSummary({
        rentalCost: 0,
        insuranceCost: 0,
        basePrice: 0,
        gst: 0,
        convFee: 100,
        total: 0,
        hours: 0,
        error: "Minimum booking duration is 6 hours.",
        serverCalculated: false,
      });
      toast.error("Minimum booking duration is 6 hours.");
      setTimeout(() => router.push('/'), 2500);
      return;
    }

    async function calculatePrice() {
      try {
        console.log('🗓️ Calculating price with dates:', { pickup, returnTime });

        // Format dates to ISO format for server compatibility
        const pickupTimeISO = pickupDate.toISOString();
        const returnTimeISO = returnDate.toISOString();

        console.log('✅ Dates formatted successfully:', {
          original: { pickup, returnTime },
          formatted: { pickupTimeISO, returnTimeISO }
        });

        const response = await fetch('/api/create-order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            carId: car.id,
            pickupTime: pickupTimeISO,
            returnTime: returnTimeISO,
            couponCode: couponInfo?.code
          })
        });

        if (!response.ok) {
          const rawText = await response.text();
          let errorData = {};
          try {
            errorData = JSON.parse(rawText);
          } catch (parseError) {
            console.error('Failed to parse error response as JSON:', rawText);
            errorData = { error: `Server error (${response.status}): ${rawText || 'Unknown error'}` };
          }
          console.error('❌ Server price calculation failed:', { status: response.status, errorData });
          throw new Error(errorData.error || `Failed to calculate price (${response.status}).`);
        }

        const data = await response.json();

        if (data.success) {
          setPriceSummary({
            rentalCost: data.pricing.costs.rentalCost,
            insuranceCost: data.pricing.costs.insuranceCost,
            basePrice: data.pricing.costs.subtotalBeforeGST,
            gst: data.pricing.costs.gst,
            convFee: data.pricing.costs.convFee,
            total: data.pricing.total,
            hours: data.pricing.hours,
            error: null,
            serverCalculated: true,
          });

          // Update local discount state to match server for display consistency
          if (data.pricing.discount !== undefined) {
            setDiscount(data.pricing.discount);
          }

          setOrderDetails({
            orderId: data.orderId,
            amount: data.pricing.total,
            key: data.key,
          });
        } else {
          throw new Error(data.error || 'Price calculation failed');
        }
      } catch (error) {
        console.error('Price calculation error:', error);
        setPriceSummary({
          rentalCost: 0,
          insuranceCost: 0,
          basePrice: 0,
          gst: 0,
          convFee: 100,
          total: 0,
          hours: 0,
          error: error.message,
          serverCalculated: false,
        });
      }
    }

    calculatePrice();
  }, [car, pickup, returnTime, couponInfo]);

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
  /*                            COUPON HANDLING                                  */
  /* -------------------------------------------------------------------------- */
  async function handleApplyCoupon() {
    if (!couponCode.trim()) {
      setCouponFeedback({
        show: true,
        type: 'error',
        message: "Please enter a coupon code",
        discount: 0
      });
      return;
    }

    setApplyingCoupon(true);
    try {
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          code: couponCode,
          subtotal: priceSummary.basePrice,
          orderTotal: priceSummary.rentalCost + priceSummary.insuranceCost + priceSummary.convFee + priceSummary.gst + discount
        })
      });

      const data = await response.json();

      if (data.valid) {
        setDiscount(data.discount);
        setCouponInfo(data.coupon);
        setCouponFeedback({
          show: true,
          type: 'success',
          message: `Hurray! '${data.coupon.code}' Applied`,
          discount: data.discount
        });
        setShowCouponDropdown(false); // Close dropdown if open
      } else {
        setDiscount(0);
        setCouponInfo(null);
        setCouponFeedback({
          show: true,
          type: 'error',
          message: data.message || "Invalid coupon code",
          discount: 0
        });
      }
    } catch (error) {
      console.error("Error applying coupon:", error);
      setCouponFeedback({
        show: true,
        type: 'error',
        message: "Failed to apply coupon",
        discount: 0
      });
    } finally {
      setApplyingCoupon(false);
    }
  }

  function handleRemoveCoupon() {
    setDiscount(0);
    setCouponInfo(null);
    setCouponCode("");
    setCouponFeedback({
      show: true,
      type: 'removed',
      message: "Coupon Removed",
      discount: 0
    });
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
      // Calculate end with 3-hour buffer for consistency with DB constraint
      const endWithBuffer = new Date(end.getTime() + (3 * 60 * 60 * 1000));
      const endWithBufferIso = formatDateTimeForDB(endWithBuffer);

      console.log('🗄️ Checking availability using unified RPC/fallback...', {
        startIso,
        endIso,
        endWithBufferIso
      });

      const { data: overlaps, error: rpcErr } = await makeAuthenticatedRequest(
        "POST",
        "rpc/check_car_overlap",
        {
          body: JSON.stringify({
            p_vehicle_id: car.id,
            p_start_time: startIso,
            p_end_time: endIso
          })
        }
      ).then(d => ({ data: d, error: null })).catch(e => ({ data: null, error: e }));

      if (!rpcErr && overlaps === true) {
        console.log('🚫 OVERLAP DETECTED! (via RPC)');
        setUnavailableData({
          type: 'booked',
          title: 'Car Unavailable',
          message: `This car has an existing booking or is under maintenance for the selected time range. Please choose another slot or vehicle.`
        });
        setBookingCheckStatus({ checking: false, overlaps: true, error: null });
        return false;
      }

      // Fallback manual check if RPC fails
      if (rpcErr) {
        console.warn('⚠️ RPC check failed, using fallback check...');
        
        // Check bookings using the range overlap operator to account for the 6-hour buffer
        const bookingRes = await fetch(
          `${typeof window !== 'undefined' ? '/api/sb' : process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/bookings?vehicle_id=eq.${car.id}&status=eq.confirmed&booking_range=ov.(%5B${startIso},${endWithBufferIso}%29)&select=id`,
          {
            headers: {
              'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
            }
          }
        );
        const bookingData = await bookingRes.json();

        // Check maintenance table - maintenance doesn't have booking_range column, 
        // so we check if maintenance window overlaps with our buffered range
        const maintenanceRes = await fetch(
          `${typeof window !== 'undefined' ? '/api/sb' : process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/maintenance_logs?vehicle_id=eq.${car.id}&start_time=lt.${endWithBufferIso}&end_time=gt.${startIso}&select=id`,
          {
            headers: {
              'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
            }
          }
        );
        const maintenanceData = await maintenanceRes.json();

        if (bookingData.length > 0 || maintenanceData.length > 0) {
          console.log('🚫 OVERLAP DETECTED! (via fallback)');
          setUnavailableData({
            type: 'booked',
            title: 'Car Unavailable',
            message: `This car has an existing booking or is under maintenance for the selected time range.`
          });
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
      const response = await fetch(`/api/locks?vehicle_id=${car.id}`, {
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
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
          // Show Unavailability Card for Locked Status
          setUnavailableData({
            type: 'locked',
            title: 'Car Unavailable',
            message: 'Someone else is currently booking this car. We are redirecting you to find other available cars.'
          });

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
                'Content-Type': 'application/json'
              },
              credentials: 'include',
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
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          vehicle_id: car.id,
          start_time: formatDateTimeForDB(start),
          end_time: formatDateTimeForDB(end)
        })
      });

      if (!lockCreateResponse.ok) {
        const errorData = await lockCreateResponse.json();
        if (errorData.locked_by_other) {
          // Show Unavailability Card for Locked (Race Condition)
          setUnavailableData({
            type: 'locked',
            title: 'Car Just Booked',
            message: 'Someone just locked this car for booking. Redirecting you to other options...'
          });

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
  async function createBooking(paymentId, orderId) {
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
      hours: priceSummary.hours,
      base_price: priceSummary.basePrice,
      gst: priceSummary.gst,
      conv_fee: priceSummary.convFee,
      total_amount: priceSummary.total,
      payment_id: paymentId,
      razorpay_order_id: orderId,
      pickup_datetime_raw: pickup,
      return_datetime_raw: returnTime,
      start_time: formatDateTimeForDB(start),
      end_time: formatDateTimeForDB(end),
      status: "confirmed",
      created_at: formatDateTimeForDB(new Date()),
      applied_coupon: couponInfo?.code || null,
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
  /*                          SECURE PAYMENT HANDLER                             */
  /* -------------------------------------------------------------------------- */
  const handlePayment = async () => {
    // Step 1: Validate prerequisites
    if (!priceSummary.total || !priceSummary.serverCalculated) {
      return alert("Price not calculated or invalid amount");
    }

    if (!orderDetails.orderId || !orderDetails.key) {
      return alert("Order details not available. Please refresh the page.");
    }

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

    // Step 6: Proceed with payment using server-created order
    const options = {
      key: orderDetails.key,
      amount: Math.round(orderDetails.amount * 100), // Use server-calculated amount
      currency: "INR",
      order_id: orderDetails.orderId, // Use server-created order ID

      name: "MMmiles Rentals",
      description: `${car.make} ${car.model}`,
      image: "/logo.png",

      handler: async (response) => {
        try {
          const pid = response.razorpay_payment_id;
          const oid = response.razorpay_order_id;
          const signature = response.razorpay_signature;

          // Show processing card
          setBookingResult({
            show: true,
            type: 'processing',
            title: 'Processing Payment',
            message: 'Please wait while we confirm your booking...',
            bookingId: null,
            paymentId: pid
          });

          // Mark step 3 as complete when payment is successful
          setCompletedSteps(prev => new Set([...prev, 2, 3]));

          const booking = await createBooking(pid, oid);

          const bookingId = Array.isArray(booking)
            ? booking[0]?.id
            : booking?.id;

          // Step 7: Handle booking completion with payment verification
          try {
            const completionResponse = await fetch('/api/booking-complete', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              credentials: 'include',
              body: JSON.stringify({
                vehicle_id: car.id,
                booking_id: bookingId,
                payment_id: pid,
                expected_amount: orderDetails.amount // Server verifies this matches payment
              })
            });

            if (!completionResponse.ok) {
              const errorData = await completionResponse.json();
              throw new Error(errorData.error || 'Booking completion failed');
            }

            console.log('Booking completed successfully with verified payment');

            // Note: Coupon used_count is incremented server-side in booking-complete via RPC

            // Show success card
            setBookingResult({
              show: true,
              type: 'success',
              title: 'Booking Confirmed! 🎉',
              message: `Your ${car.make} ${car.model} is booked successfully. Get ready for your trip!`,
              bookingId: bookingId,
              paymentId: pid
            });

          } catch (completionError) {
            console.error('Booking completion error:', completionError);
            setBookingResult({
              show: true,
              type: 'failed',
              title: 'Booking Issue',
              message: 'Payment verified but booking completion failed. Please contact support with Payment ID: ' + pid,
              bookingId: null,
              paymentId: pid
            });
            return;
          }

        } catch (err) {
          console.error(err);
          setBookingResult({
            show: true,
            type: 'failed',
            title: 'Booking Failed',
            message: 'Payment succeeded but booking failed. Please contact support.',
            bookingId: null,
            paymentId: null
          });
        }
      },

      prefill: {
        name: `${customer.first_name} ${customer.last_name}`,
        email: customer.email,
        contact: customer.phone,
      },

      // Add verification for additional security
      notes: {
        vehicle_id: car.id.toString(),
        user_id: loggedInUser.sub
      }
    };

    new window.Razorpay(options).open();
  };

  /* -------------------------------------------------------------------------- */
  /*                                   UI                                        */
  /* -------------------------------------------------------------------------- */

  if (loading) return <Loading fullScreen={true} size={60} />;
  if (!car) return (
    <EmptyState
      icon="🚗"
      title="Vehicle Not Found"
      message="This vehicle is no longer available. Please search for another car."
      actionLabel="Find Cars"
      onAction={() => router.push('/search')}
    />
  );

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

    // Directly trigger payment from Review Journey step
    handlePayment();
  };

  const handleBackToStep = (step) => {
    setCurrentStep(step);
    // Keep completed steps but allow going back
  };

  return (
    <div className={styles.pageWrap}>
      {/* Unavailability Overlay */}
      {unavailableData && (
        <div className={styles.unavailabilityOverlay}>
          <div className={styles.unavailabilityCard}>
            <div className={styles.unavailabilityIcon}>
              {unavailableData.type === 'booked' ? '📅' : '🔒'}
            </div>
            <h3 className={styles.unavailabilityTitle}>{unavailableData.title}</h3>
            <p className={styles.unavailabilityMessage}>{unavailableData.message}</p>

            {/* Timer Ring */}
            <UnavailabilityTimer duration={5} onComplete={handleRedirect} />

            <button className={styles.redirectBtn} onClick={handleRedirect}>
              Find Similar Cars 🚗
            </button>
          </div>
        </div>
      )}

      {/* Booking Result Overlay */}
      {bookingResult.show && (
        <div className={styles.bookingResultOverlay}>
          <div className={styles.bookingResultCard}>
            <div className={`${styles.bookingResultIcon} ${bookingResult.type === 'success' ? styles.successIcon :
              bookingResult.type === 'processing' ? styles.processingIcon :
                styles.failedIcon
              }`}>
              {bookingResult.type === 'success' ? '✓' :
                bookingResult.type === 'processing' ? '⏳' : '✕'}
            </div>

            <h3 className={styles.bookingResultTitle}>{bookingResult.title}</h3>
            <p className={styles.bookingResultMessage}>{bookingResult.message}</p>

            {bookingResult.type === 'success' && (
              <>
                <div className={styles.bookingDetails}>
                  <div className={styles.bookingDetailRow}>
                    <span className={styles.detailLabel}>Booking ID</span>
                    <span className={styles.detailValue}>#{bookingResult.bookingId}</span>
                  </div>
                  <div className={styles.bookingDetailRow}>
                    <span className={styles.detailLabel}>Payment ID</span>
                    <span className={styles.detailValue}>{bookingResult.paymentId}</span>
                  </div>
                  <div className={styles.bookingDetailRow}>
                    <span className={styles.detailLabel}>Car</span>
                    <span className={styles.detailValue}>{car?.make} {car?.model}</span>
                  </div>
                  <div className={styles.bookingDetailRow}>
                    <span className={styles.detailLabel}>Amount Paid</span>
                    <span className={styles.detailValue}>₹{priceSummary.total}</span>
                  </div>
                </div>

                <button
                  className={styles.successBtn}
                  onClick={() => router.push('/dashboard?tab=orders')}
                >
                  View My Bookings 📋
                </button>
                <button
                  className={styles.homeBtn}
                  onClick={() => router.push('/')}
                >
                  Back to Home
                </button>
              </>
            )}

            {bookingResult.type === 'processing' && (
              <div className={styles.processingSpinner}>
                <div className={styles.spinner}></div>
              </div>
            )}

            {bookingResult.type === 'failed' && (
              <>
                {bookingResult.paymentId && (
                  <div className={styles.bookingDetails}>
                    <div className={styles.bookingDetailRow}>
                      <span className={styles.detailLabel}>Payment ID</span>
                      <span className={styles.detailValue}>{bookingResult.paymentId}</span>
                    </div>
                  </div>
                )}
                <button
                  className={styles.retryBtn}
                  onClick={() => {
                    setBookingResult({ show: false, type: null, title: '', message: '', bookingId: null, paymentId: null });
                  }}
                >
                  Try Again 🔄
                </button>
                <button
                  className={styles.supportBtn}
                  onClick={() => window.open('mailto:support@mmmiles.com', '_blank')}
                >
                  Contact Support
                </button>
              </>
            )}
          </div>
        </div>
      )}

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
          <div className={`${styles.stepCircle} ${(completedSteps.has(2) || (currentStep === 2 && agree)) ? styles.stepDone :
            currentStep === 2 ? styles.stepActive :
              styles.stepInactive
            }`}>
            {(completedSteps.has(2) || (currentStep === 2 && agree)) ? '✔' : '2'}
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

      {/* STEP 1: Passenger Details - Centered */}
      {currentStep === 1 && (
        <div className={styles.centeredContainer}>
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
              Review Journey →
            </button>
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

                <div className={styles.featuresGrid}>
                  <div className={styles.featureItem}>
                    <UserIcon className={styles.featureIcon} />
                    <span>{car.seating_capacity} Seat</span>
                  </div>
                  <div className={styles.featureItem}>
                    <CogIcon className={styles.featureIcon} />
                    <span>{car.transmission_type}</span>
                  </div>
                  <div className={styles.featureItem}>
                    <CalendarIcon className={styles.featureIcon} />
                    <span>{car.model_year} Model</span>
                  </div>
                </div>

                <div className={styles.divider} />

                <div className={styles.priceRow}>
                  <div className={styles.price}>
                    ₹{priceSummary.total.toLocaleString('en-IN')}
                    <span className={styles.priceper}>For {formatDuration(priceSummary.hours)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.infoRow}>
              <div className={styles.infoCard}>
                <h3>Inclusion / Exclusions</h3>
                <div className={styles.infoList}>
                  <p><span className={styles.infoListicon}>✖</span> Fuel not included. Guest should return the car with the same fuel level as at start.</p>
                  <p><span className={styles.infoListicon}>✖</span> Check with host for Fastag recharge.</p>
                  <p><span className={styles.infoListicon}>✖</span> Trip Protection excludes: Off-road use, driving under influence, over-speeding, restricted zones.</p>
                  <p><span className={styles.infoListicongreen}>✔</span> Carry orginal Driving License and Aadhar card along with Bike as a proof of submission as per the Host requirements.</p>
                </div>
              </div>

              <div className={styles.infoCard}>
                <h3>Cancellation Policy</h3>
                {pickup && (() => {
                  const start = parseDateInput(pickup);
                  if (!start) return <p className={styles.small}>Policy details unavailable.</p>;

                  const deadline90 = new Date(start.getTime() - 24 * 60 * 60 * 1000);
                  const deadline50 = new Date(start.getTime() - 4 * 60 * 60 * 1000);

                  const formatDate = (d) => d.toLocaleString('en-IN', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true
                  });

                  return (
                    <>
                      {/* 90% Refund Policy */}
                      <div style={{ marginBottom: '15px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                          <span>90% Refund</span>
                          <span style={{ color: '#bf9860' }}>Before {formatDate(deadline90)}</span>
                        </div>
                        <p className={styles.smallMuted} style={{ marginTop: '2px', fontSize: '12px' }}>
                          Cancel before 24 hrs of pickup.
                        </p>
                      </div>

                      {/* 50% Refund Policy */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                          <span>50% Refund</span>
                          <span style={{ color: '#856404' }}>Before {formatDate(deadline50)}</span>
                        </div>
                        <p className={styles.smallMuted} style={{ marginTop: '2px', fontSize: '12px' }}>
                          Cancel between {formatDate(deadline90)} and {formatDate(deadline50)} (4 hrs before pickup).
                        </p>
                      </div>

                      {/* Visual Bar */}
                      <div style={{
                        marginTop: '15px',
                        height: '8px',
                        borderRadius: '4px',
                        background: 'linear-gradient(90deg, #bf9860 50%, #eaddc5 50%)',
                        overflow: 'hidden'
                      }}>
                      </div>

                      <p className={styles.refundTimebelow} style={{ marginTop: '12px' }}>
                        <b>Important</b><span className={styles.refundTimebelowstar}>*</span>:
                        No refund if cancelled after {formatDate(deadline50)}. Convenience fee is non-refundable.
                      </p>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <aside className={styles.rightCol}>
            <div className={styles.summaryCard}>
              <h2 className={styles.summaryTitle}>Trip Summary</h2>

              <div className={styles.summaryGroup}>
                <div className={styles.summaryRow}>
                  <div className={styles.rowLabel}>Duration</div>
                  <div className={styles.rowValue}>{formatDuration(priceSummary.hours)}</div>
                </div>

                <div className={styles.summaryRow}>
                  <div className={styles.rowLabel}>Rental Cost</div>
                  <div className={styles.rowValue}>₹{priceSummary.rentalCost.toLocaleString('en-IN')}</div>
                </div>

                <div className={`${styles.summaryRow} ${styles.rowLight}`}>
                  <div className={styles.rowLabelWithIcon}>
                    Insurance
                    <div className={styles.tooltipParams}>
                      <InformationCircleIcon className={styles.infoIcon} />
                      <span className={styles.tooltipText}>Covered for standard damages</span>
                    </div>
                  </div>
                  <div className={styles.rowValue}>₹{priceSummary.insuranceCost.toLocaleString('en-IN')}</div>
                </div>

                <div className={`${styles.summaryRow} ${styles.rowLight}`}>
                  <div className={styles.rowLabel}>Convenience Fee</div>
                  <div className={styles.rowValue}>₹{priceSummary.convFee.toLocaleString('en-IN')}</div>
                </div>

                <div className={`${styles.summaryRow} ${styles.rowLight}`}>
                  <div className={styles.rowLabelWithIcon}>
                    GST (18%)
                    <div className={styles.tooltipParams}>
                      <InformationCircleIcon className={styles.infoIcon} />
                      <span className={styles.tooltipText}>Calculated on base fare</span>
                    </div>
                  </div>
                  <div className={styles.rowValue}>₹{priceSummary.gst.toLocaleString('en-IN')}</div>
                </div>

                {discount > 0 && (
                  <div className={`${styles.summaryRow} ${styles.rowLight}`}>
                    <div className={styles.rowLabel}>Discount</div>
                    <div className={styles.rowValue} style={{ color: '#16a34a' }}>-₹{discount.toLocaleString('en-IN')}</div>
                  </div>
                )}
              </div>


              <div className={styles.couponSection}>
                {discount > 0 ? (
                  <div className={styles.appliedCoupon}>
                    <span className={styles.couponCode}>Code {couponInfo?.code} applied</span>
                    <button className={styles.removeCouponBtn} onClick={handleRemoveCoupon}>Remove</button>
                  </div>
                ) : (
                  <div className={styles.couponInputGroup}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <input
                        type="text"
                        className={styles.couponInput}
                        placeholder="Enter Coupon Code"
                        value={couponCode}
                        onChange={(e) => {
                          setCouponCode(e.target.value.toUpperCase());
                          setShowCouponDropdown(true);
                        }}
                        onFocus={() => setShowCouponDropdown(true)}
                        onBlur={() => setTimeout(() => setShowCouponDropdown(false), 200)}
                      />
                      {showCouponDropdown && publicCoupons.length > 0 && (
                        <div className={styles.couponDropdown}>
                          {publicCoupons
                            .filter(c => c.code.toLowerCase().includes(couponCode.toLowerCase()))
                            .map((c) => (
                              <div
                                key={c.id}
                                className={styles.couponDropdownItem}
                                onMouseDown={(e) => {
                                  e.preventDefault(); // Prevent blur
                                  setCouponCode(c.code);
                                  setShowCouponDropdown(false);
                                }}
                              >
                                <div className={styles.dropdownCode}>{c.code}</div>
                                <div className={styles.dropdownDesc}>{c.description}</div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                    <button
                      className={styles.applyCouponBtn}
                      onClick={handleApplyCoupon}
                      disabled={!couponCode || applyingCoupon}
                    >
                      {applyingCoupon ? "..." : "Apply"}
                    </button>
                  </div>
                )}
              </div>

              <div className={styles.totalDivider} />

              <div className={styles.totalBar}>
                <div className={styles.totalText}>Total Amount</div>
                <div className={styles.totalAmt}>₹{priceSummary.total.toLocaleString('en-IN')}</div>
              </div>

              {/* KM Limit Note */}
              {car.range_km_limit && car.range_km_limit.range_km_limit && (
                <div className={styles.kmLimitNote}>
                  <span className={styles.kmIcon}>🛣️</span>
                  <span>
                    Price includes only <strong>{car.range_km_limit.range_km_limit} km</strong> of ride.
                    <br />
                    Extra usage charged at <strong>₹{car.range_km_limit.price_per_extra_km}/km</strong> after that.
                  </span>
                </div>
              )}

              <button
                className={styles.payBtn}
                disabled={
                  !agree ||
                  !priceSummary.total ||
                  !priceSummary.serverCalculated ||
                  !orderDetails.orderId ||
                  bookingCheckStatus.checking ||
                  bookingCheckStatus.overlaps ||
                  lockStatus.checking ||
                  lockStatus.blocked
                }
                title={!agree ? "Please accept terms & conditions" : "Proceed to Payment"}
                onClick={handleStep2Next}
              >
                {priceSummary.error ? (
                  "Price Calculation Failed"
                ) : !priceSummary.serverCalculated ? (
                  "Calculating Price..."
                ) : bookingCheckStatus.checking ? (
                  "Checking Availability..."
                ) : bookingCheckStatus.overlaps ? (
                  "Time Conflict"
                ) : lockStatus.checking ? (
                  "Checking Lock Status..."
                ) : lockStatus.blocked ? (
                  "Currently Unavailable"
                ) : lockStatus.canProceed ? (
                  <div className={styles.payBtnContent}>
                    <LockClosedIcon className={styles.lockIcon} />
                    <span>Pay ₹{priceSummary.total.toLocaleString('en-IN')}</span>
                  </div>
                ) : (
                  <div className={styles.payBtnContent}>
                    <LockClosedIcon className={styles.lockIcon} />
                    <span>Pay ₹{priceSummary.total.toLocaleString('en-IN')}</span>
                  </div>
                )}
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
                  <a href="/refund" className={styles.link}>Cancellation Policy</a> and{" "}
                  <a href="/terms" className={styles.link}>Terms of Service</a>.
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
                !priceSummary.serverCalculated ||
                !orderDetails.orderId ||
                bookingCheckStatus.checking ||
                bookingCheckStatus.overlaps ||
                lockStatus.checking ||
                lockStatus.blocked
              }
              onClick={() => {
                console.log('💳 Payment button clicked!', {
                  priceSummary: priceSummary.total,
                  serverCalculated: priceSummary.serverCalculated,
                  orderDetails,
                  bookingCheckStatus,
                  lockStatus,
                  disabled: !priceSummary.total ||
                    !priceSummary.serverCalculated ||
                    !orderDetails.orderId ||
                    bookingCheckStatus.checking ||
                    bookingCheckStatus.overlaps ||
                    lockStatus.checking ||
                    lockStatus.blocked
                });
                handlePayment();
              }}
            >
              {priceSummary.error ? (
                "Price Calculation Failed"
              ) : !priceSummary.serverCalculated ? (
                "Calculating Price..."
              ) : bookingCheckStatus.checking ? (
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
      {/* Coupon Feedback Modal */}
      {couponFeedback.show && (
        <div className={styles.couponFeedbackOverlay} onClick={() => setCouponFeedback({ ...couponFeedback, show: false })}>
          <div className={styles.couponFeedbackCard} onClick={(e) => e.stopPropagation()}>
            <div className={`${styles.feedbackIcon} ${styles[couponFeedback.type]}`}>
              {couponFeedback.type === 'success' && '🎉'}
              {couponFeedback.type === 'removed' && '🗑️'}
              {couponFeedback.type === 'error' && '⚠️'}
            </div>
            <h3 className={styles.feedbackTitle}>
              {couponFeedback.type === 'success' ? 'Savings Unlocked!' :
                couponFeedback.type === 'removed' ? 'Coupon Removed' : 'Oops!'}
            </h3>
            <p className={styles.feedbackMessage}>{couponFeedback.message}</p>
            {couponFeedback.type === 'success' && (
              <div className={styles.savedAmount}>You saved ₹{couponFeedback.discount}</div>
            )}
            <button
              className={styles.feedbackCloseBtn}
              onClick={() => setCouponFeedback({ ...couponFeedback, show: false })}
            >
              Okay
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
