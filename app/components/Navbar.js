"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import "./Navbar.css";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);

    const checkToken = () => {
      const token = localStorage.getItem("auth_token");
      if (!token) return setIsLoggedIn(false);

      try {
        const payload = JSON.parse(
          atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
        );
        const now = Math.floor(Date.now() / 1000);
        if (payload?.exp && payload.exp > now) {
          setIsLoggedIn(true);
        } else {
          localStorage.removeItem("auth_token");
          setIsLoggedIn(false);
        }
      } catch {
        localStorage.removeItem("auth_token");
        setIsLoggedIn(false);
      }
    };

    checkToken();

    // ✅ Re-check on token changes (manual events + storage listener)
    window.addEventListener("auth-change", checkToken);
    window.addEventListener("storage", checkToken);

    return () => {
      window.removeEventListener("auth-change", checkToken);
      window.removeEventListener("storage", checkToken);
    };
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMainButtonClick = () => {
    if (isLoggedIn) router.push("/dashboard");
    else router.push("/login");
  };

  // 🚫 Prevent hydration mismatch by not rendering until client is ready
  if (!mounted) return null;

  return (
    <div ref={menuRef}>
      <nav className="navbar">
        {/* Logo */}
        <div className="logo">
          <Link href="/">
            <Image
              src="/mlogo.png"
              alt="MM Miles Logo"
              width={130}
              height={37}
              priority
            />
          </Link>
        </div>

        {/* Desktop Nav Links */}
        <ul className="navLinks">
          <li><Link href="/about">About Us</Link></li>
          <li><Link href="/reviews">Reviews</Link></li>
          <li><Link href="/faq">FAQ&apos;s</Link></li>
          <li><Link href="/contact">Contact Us</Link></li>
        </ul>

        {/* ✅ Dynamic Button (changes based on login state) */}
        <button className="loginBtn" onClick={handleMainButtonClick}>
          {isLoggedIn ? "Dashboard" : "Login / Signup"}
        </button>

        {/* Mobile Menu Button */}
        <button
          className="mobileMenu"
          aria-label="Toggle menu"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? "✖" : "☰"}
        </button>
      </nav>

      {/* ✅ Mobile Dropdown */}
      {menuOpen && (
        <>
          <div className="backdrop" onClick={() => setMenuOpen(false)} />
          <div
            className={`mobileDropdown ${
              menuOpen ? "dropdownOpen" : "dropdownClosed"
            }`}
          >
            <ul>
              <li>
                <Link href="/about" onClick={() => setMenuOpen(false)}>
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/reviews" onClick={() => setMenuOpen(false)}>
                  Reviews
                </Link>
              </li>
              <li>
                <Link href="/faq" onClick={() => setMenuOpen(false)}>
                  FAQ&apos;s
                </Link>
              </li>
              <li>
                <Link href="/contact" onClick={() => setMenuOpen(false)}>
                  Contact Us
                </Link>
              </li>
            </ul>

            <button
              className="bg-white text-black px-4 py-2 rounded-lg shadow"
              onClick={() => {
                handleMainButtonClick();
                setMenuOpen(false);
              }}
            >
              {isLoggedIn ? "Dashboard" : "Login / Signup"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
