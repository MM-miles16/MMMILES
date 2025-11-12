"use client";
import Image from "next/image";
import Link from "next/link";
import { FaInstagram, FaFacebookF, FaWhatsapp } from "react-icons/fa";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <div className={styles.footerbody}>
      <footer className={styles.footer}>
        <div className={styles.footerContainer}>
          {/* 🔹 Left Section (Logo + Address) */}
          <div className={styles.footerLeft}>
            <div className={styles.logoWrapper}>
              <Image
                src="/goldlogo.png"
                alt="Urban Drive Logo"
                width={250}
                height={60}
                className={styles.footerLogo}
              />
            </div>

            <p id="footer-text">
              <a href="https://maps.app.goo.gl/gpGgbDxqfo2RMTCG7" target="_blank">
                Plot No: 51, VGN Nagar phase-4, No: 62, Gurusamy Road, Nolambur,
                Ambattur Taluk, Tiruvallur district, Chennai-95, Tamilnadu
              </a>
            </p>
            <p>
              Office Number: <a href="tel:9096299666"> +91 9096299666</a>
            </p>
            <p>
              Email:{" "}
              <a href="mailto:urbandrive.chennai@gmail.com">
                urbandrive.chennai@gmail.com
              </a>
            </p>
          </div>

          {/* 🔹 Right Section (Social + Links) */}
          <div className={styles.footerRight}>
            <div className={styles.followRow}>
              <span className={styles.followText}>Follow us & Stay Notified</span>
              <div className={styles.socialIcons}>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                >
                  <FaInstagram className={`${styles.icon} ${styles.instagram}`} />
                </a>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                >
                  <FaFacebookF className={`${styles.icon} ${styles.facebook}`} />
                </a>
                <a
                  href="https://wa.me/919096299666"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                >
                  <FaWhatsapp className={`${styles.icon} ${styles.whatsapp}`} />
                </a>
              </div>
            </div>

            {/* Links under icons */}
            <div className={styles.footerLinks}>
              <div>
                <h4>Company</h4>
                <Link href="/about">About us</Link>
                <Link href="/contact">Contact us</Link>
                <Link href="/reviews">Reviews</Link>
                <Link href="/advantages">Advantages</Link>
              </div>

              <div>
                <h4>Support</h4>
                <Link href="/faq">FAQ&apos;s</Link>
                <Link href="/terms">T&amp;C</Link>
                <Link href="/privacy">Privacy Policy</Link>
                <Link href="/refund">Refund</Link>
              </div>

              <div>
                <h4>Handy Links</h4>
                <a href="https://www.thrillophilia.com/places-to-visit-in-south-india">
                  Explore Places
                </a>
                <Link href="/steps">Steps to Book</Link>
                <Link href="/top-cars">Top Rented Cars</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
