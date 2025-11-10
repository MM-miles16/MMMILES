"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Clock, ShoppingCart, LogOut } from "lucide-react";
import styles from "./dashboard.module.css";

export default function Dashboard() {
  const router = useRouter();
  const [activeBox, setActiveBox] = useState(null);
  const [userPhone, setUserPhone] = useState(null);
  const [loading, setLoading] = useState(true); // show nothing until validated

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      const payload = JSON.parse(
        atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
      );
      const now = Math.floor(Date.now() / 1000);

      if (!payload?.exp || payload.exp < now) {
        // Token expired
        localStorage.removeItem("auth_token");
        router.replace("/login");
      } else {
        setUserPhone(payload.sub || "User");
        setLoading(false); // token valid, show dashboard
      }
    } catch (err) {
      // Malformed or invalid token
      localStorage.removeItem("auth_token");
      router.replace("/login");
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_profile");

    // 🔔 Notify Navbar instantly
    window.dispatchEvent(new Event("auth-change"));

    router.replace("/login");
  };

  const handleBoxClick = (id) => {
    setActiveBox(id === activeBox ? null : id);
  };

  const boxStateClass = (id) => {
    if (!activeBox) return "";
    return id === activeBox ? styles.activeBox : styles.inactiveBox;
  };

  // Prevent flicker before redirect or data load
  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <h2>Loading Dashboard...</h2>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.background} />

      {/* Topbar */}
      <div className={styles.topbar}>
        <p className={styles.welcomeText}>
          Logged in as <strong>{userPhone || "User"}</strong>
        </p>
        <button className={styles.logoutBtn} onClick={handleLogout}>
          <LogOut size={18} /> Logout
        </button>
      </div>

      <div className={styles.content}>
        <h1 className={styles.title}>Welcome to MM Miles</h1>
        <p className={styles.subtitle}>
          Manage your rides, track bookings, and get ready for your next journey.
        </p>

        <div className={styles.grid}>
          {/* Profile Box */}
          <Link
          href="/profile"
            className={`${styles.box} ${styles.profile} ${boxStateClass("profile")}`}
            onClick={() => handleBoxClick("profile")}
          >
            <User className={styles.icon} />
            <span>My Profile</span>
          </Link>

          {/* Booking History Box */}
          <Link
            href="/history"
            className={`${styles.box} ${styles.history} ${boxStateClass("history")}`}
            onClick={() => handleBoxClick("history")}
          >
            <Clock className={styles.icon} />
            <span>Booking History</span>
          </Link>

          {/* Checkout Box */}
          <Link
            href="/checkout"
            className={`${styles.box} ${styles.checkout} ${boxStateClass("checkout")}`}
            onClick={() => handleBoxClick("checkout")}
          >
            <ShoppingCart className={styles.icon} />
            <span>Check-Out Cart</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
