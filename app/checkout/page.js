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
  const plan = searchParams.get("plan") || "BASIC"; // plan passed from car page

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

  // ✅ Check login and fetch user info
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      router.push("/login?redirect=/checkout");
      return;
    }
    try {
      const payload = JSON.parse(
        atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
      );
      setLoggedInUser(payload);
    } catch {
      router.push("/login?redirect=/checkout");
    }
  }, [router]);

  // ✅ Fetch car + host details
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

  // ✅ Fetch customer details if exist
  useEffect(() => {
    async function fetchCustomer() {
      if (!loggedInUser?.sub) return;
      const { data } = await supabase
        .from("customers")
        .select("*")
        .eq("user_id", loggedInUser.sub)
        .single();
      if (data) setCustomer(data);
    }
    fetchCustomer();
  }, [loggedInUser]);

  // ✅ Calculate total price
  useEffect(() => {
    if (!car) return;

    let baseRate =
      plan === "MAX"
        ? car.price_max
        : plan === "PLUS"
        ? car.price_plus
        : car.price_basic;

    baseRate = Number(baseRate) || 0;

    const gst = baseRate * 0.18; // 18% GST
    const convFee = 100; // hardcoded convenience fee
    const total = baseRate + gst + convFee;

    setPriceSummary({
      basePrice: baseRate,
      gst,
      convFee,
      total,
    });
  }, [plan, car]);

  // ✅ Handle save/update customer info
  async function handleSave() {
    if (!loggedInUser?.sub) return;

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
          phone: loggedInUser.phone,
          address: customer.address,
        },
      ]);
    }
    setEditing(false);
  }

  // ✅ Razorpay Integration
  const handlePayment = async () => {
    if (!priceSummary.total) return;

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: Math.round(priceSummary.total * 100), // in paise
      currency: "INR",
      name: "MMmiles Rentals",
      description: `${car?.make} ${car?.model} booking`,
      image: "/logo.png",
      handler: function (response) {
        alert("Payment Successful! Razorpay ID: " + response.razorpay_payment_id);
        router.push("/booking-success");
      },
      prefill: {
        name: `${customer.first_name} ${customer.last_name}`,
        email: customer.email,
        contact: customer.phone,
      },
      theme: {
        color: "#d4a762",
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  if (loading) return <p className={styles.loading}>Loading...</p>;
  if (!car) return <p className={styles.error}>Car not found</p>;

  return (
    <div className={styles.checkoutContainer}>
      <div className={styles.leftColumn}>
        {/* Car Info */}
        <div className={styles.carCard}>
          <Image
            src={car.vehicle_images?.[0]?.image_url || "/cars/default.jpg"}
            alt="Car"
            width={400}
            height={250}
            className={styles.carImage}
          />
          <div className={styles.carDetails}>
            <h2>
              {car.make} {car.model} ({car.model_year})
            </h2>
            <p>
              Hosted by <strong>{host?.full_name || "TODO: Host Name"}</strong>
            </p>
            <p>📍 {car.location_name}, {car.city}</p>
          </div>
        </div>

        {/* Customer Info */}
        <div className={styles.formSection}>
          <h3>Your Details</h3>
          <div className={styles.formGroup}>
            <label>First Name</label>
            <input
              type="text"
              value={customer.first_name || ""}
              onChange={(e) => {
                setCustomer({ ...customer, first_name: e.target.value });
                setEditing(true);
              }}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Last Name</label>
            <input
              type="text"
              value={customer.last_name || ""}
              onChange={(e) => {
                setCustomer({ ...customer, last_name: e.target.value });
                setEditing(true);
              }}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Email</label>
            <input
              type="email"
              value={customer.email || ""}
              onChange={(e) => {
                setCustomer({ ...customer, email: e.target.value });
                setEditing(true);
              }}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Home Address</label>
            <textarea
              rows="3"
              value={customer.address || ""}
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
        <p>
          <strong>Selected Plan:</strong> {plan}
        </p>
        <div className={styles.priceBreakdown}>
          <p>Base Price: ₹{priceSummary.basePrice}</p>
          <p>Convenience Fee: ₹{priceSummary.convFee}</p>
          <p>GST (18%): ₹{priceSummary.gst.toFixed(2)}</p>
          <hr />
          <h4>Total: ₹{priceSummary.total.toFixed(2)}</h4>
        </div>
        <button className={styles.payBtn} onClick={handlePayment}>
          Pay Now
        </button>
      </div>
    </div>
  );
}
