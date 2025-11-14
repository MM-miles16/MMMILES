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
  /*                               PAYMENT HANDLER                               */
  /* -------------------------------------------------------------------------- */
  const handlePayment = () => {
    if (!priceSummary.total) return alert("Invalid amount");

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

  return (
    <div className={styles.checkoutContainer}>
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

          {["first_name", "last_name", "email"].map((field) => (
            <div className={styles.formGroup} key={field}>
              <label>{field.replace("_", " ").toUpperCase()}</label>
              <input
                type="text"
                value={customer[field]}
                onChange={(e) => {
                  setCustomer({ ...customer, [field]: e.target.value });
                  setEditing(true);
                }}
              />
            </div>
          ))}

          <div className={styles.formGroup}>
            <label>Home Address</label>
            <textarea
              rows="3"
              value={customer.address}
              onChange={(e) => {
                setCustomer({ ...customer, address: e.target.value });
                setEditing(true);
              }}
            />
          </div>

          <button
            className={styles.saveBtn}
            disabled={!editing}
            onClick={handleSave}
          >
            {editing ? "Save Changes" : "Saved ✓"}
          </button>
        </div>
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

        <button className={styles.payBtn} onClick={handlePayment}>
          Pay Now
        </button>
      </div>
    </div>
  );
}
