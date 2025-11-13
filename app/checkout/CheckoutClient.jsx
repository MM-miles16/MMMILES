"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { supabase } from "../../lib/supabaseClient";
import styles from "./Checkout.module.css";

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
    address: "",
    phone: "",
  });

  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const [priceSummary, setPriceSummary] = useState({
    basePrice: 0,
    gst: 0,
    convFee: 0,
    total: 0,
  });

  const [loggedInUser, setLoggedInUser] = useState(null);

  // Load Razorpay script
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.Razorpay) return;
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    document.body.appendChild(s);
  }, []);

  // 🔥 FIXED LOGIN CHECK + Supabase Session Injection
  useEffect(() => {
    const token = typeof window !== "undefined"
      ? localStorage.getItem("auth_token")
      : null;

    if (!token) {
      router.push(
        `/login?redirect=${encodeURIComponent(
          window.location.pathname + window.location.search
        )}`
      );
      return;
    }

    try {
      const payload = JSON.parse(
        atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
      );

      setLoggedInUser(payload);

      // ⭐ THE IMPORTANT FIX — now RLS will work!
      supabase.auth.setSession({
        access_token: token,
        refresh_token: null,
      });

    } catch (err) {
      console.error("JWT parsing error:", err);
      router.push("/login?redirect=/checkout");
    }
  }, [router]);

  // Fetch car
  useEffect(() => {
    async function fetchCar() {
      try {
        const { data, error } = await supabase
          .from("vehicles")
          .select("*, hosts(*), vehicle_images(*)")
          .eq("id", carId)
          .single();

        if (error) throw error;
        setCar(data);
        setHost(data.hosts);
      } catch (err) {
        console.error("Error fetching car:", err);
      } finally {
        setLoading(false);
      }
    }
    if (carId) fetchCar();
  }, [carId]);

  // Fetch customer details
  useEffect(() => {
    async function fetchCustomer() {
      if (!loggedInUser?.sub) return;
      try {
        const { data } = await supabase
          .from("customers")
          .select("*")
          .eq("user_id", loggedInUser.sub)
          .single();

        if (data)
          setCustomer({
            first_name: data.first_name || "",
            last_name: data.last_name || "",
            email: data.email || "",
            address: data.address || "",
            phone: data.phone || loggedInUser.phone_number || "",
          });
      } catch (err) {
        console.log("No customer record yet.");
      }
    }
    fetchCustomer();
  }, [loggedInUser]);

  // Calculate total price
  useEffect(() => {
    if (!car) return;

    let baseRate =
      plan === "MAX"
        ? car.price_max
        : plan === "PLUS"
        ? car.price_plus
        : car.price_basic;

    baseRate = Number(baseRate) || 0;
    const gst = +(baseRate * 0.18).toFixed(2);
    const convFee = 100;
    const total = +(baseRate + gst + convFee).toFixed(2);

    setPriceSummary({ basePrice: baseRate, gst, convFee, total });
  }, [plan, car]);

  // Insert or update customer info
  async function handleSave() {
    if (!loggedInUser?.sub) return;

    try {
      const { data: existing } = await supabase
        .from("customers")
        .select("id")
        .eq("user_id", loggedInUser.sub)
        .single();

      if (existing) {
        await supabase
          .from("customers")
          .update({
            first_name: customer.first_name,
            last_name: customer.last_name,
            email: customer.email,
            address: customer.address,
          })
          .eq("user_id", loggedInUser.sub);
      } else {
        await supabase.from("customers").insert([
          {
            user_id: loggedInUser.sub,
            first_name: customer.first_name,
            last_name: customer.last_name,
            email: customer.email,
            phone: customer.phone || loggedInUser.phone_number,
            address: customer.address,
          },
        ]);
      }

      setEditing(false);
    } catch (err) {
      console.error("Error saving customer:", err);
    }
  }

  // Handle payment
  const handlePayment = () => {
    if (!priceSummary.total) return;

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: priceSummary.total * 100,
      currency: "INR",
      name: "MMmiles Rentals",
      description: `${car.make} ${car.model} booking`,
      image: "/logo.png",
      handler: (response) => {
        alert("Payment Successful: " + response.razorpay_payment_id);
        router.push("/booking-success");
      },
      prefill: {
        name: `${customer.first_name} ${customer.last_name}`,
        email: customer.email,
        contact: customer.phone,
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  if (loading) return <p className={styles.loading}>Loading...</p>;
  if (!car) return <p className={styles.error}>Car Not Found</p>;

  return (
    <div className={styles.checkoutContainer}>
      <div className={styles.leftColumn}>
        {/* Car Info */}
        <div className={styles.carCard}>
          <Image
            src={car.vehicle_images?.[0]?.image_url || "/cars/default.jpg"}
            width={400}
            height={250}
            alt="Car"
            className={styles.carImage}
          />
          <div className={styles.carDetails}>
            <h2>
              {car.make} {car.model} ({car.model_year})
            </h2>
            <p>
              Hosted by <strong>{host?.full_name}</strong>
            </p>
            <p>📍 {car.location_name}, {car.city}</p>
          </div>
        </div>

        {/* Customer Details Form */}
        <div className={styles.formSection}>
          <h3>Your Details</h3>

          {["first_name", "last_name", "email"].map((field) => (
            <div className={styles.formGroup} key={field}>
              <label>{field.replace("_", " ").toUpperCase()}</label>
              <input
                type="text"
                value={customer[field] || ""}
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

      {/* Price Section */}
      <div className={styles.priceSection}>
        <h3>Trip Summary</h3>
        <p><strong>Selected Plan:</strong> {plan}</p>
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
