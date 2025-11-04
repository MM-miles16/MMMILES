"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import "./Navbar.css";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const router = useRouter();

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

  return (
    <div ref={menuRef}>
      <nav className="navbar">
        {/* Logo */}
        <div className="logo">
          <Link href="/">
            <Image src="/mlogo.png" alt="MM Miles Logo" width={130} height={37} />
          </Link>
        </div>

        {/* Desktop Nav Links */}
        <ul className="navLinks">
          <li><Link href="/about">About Us</Link></li>
          <li><Link href="/reviews">Reviews</Link></li>
          <li><Link href="/faq">FAQ&apos;s</Link></li>
          <li><Link href="/contact">Contact Us</Link></li>
        </ul>


        {/* Desktop Login */}
        <button
          className="loginBtn"
          onClick={() => router.push("/login")}
        >
          Login/Signup
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

      {/* Mobile Dropdown */}
      {menuOpen && (
        <>
          <div className="backdrop" onClick={() => setMenuOpen(false)} />
          <div className={`mobileDropdown ${menuOpen ? "dropdownOpen" : "dropdownClosed"}`}>
            <ul>
              <li><Link href="/about" onClick={() => setMenuOpen(false)}>About Us</Link></li>
              <li><Link href="/reviews" onClick={() => setMenuOpen(false)}>Reviews</Link></li>
              <Link href="/faq">FAQ's</Link>
              <li><Link href="/contact" onClick={() => setMenuOpen(false)}>Contact Us</Link></li>
            </ul>
             <button className="bg-white text-black px-4 py-2 rounded-lg shadow">
        Login/Signup
      </button>
          </div>
        </>
      )}
    </div>
  );
}
