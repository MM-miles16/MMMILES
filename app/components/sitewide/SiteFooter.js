import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { FaInstagram, FaLinkedinIn, FaWhatsapp } from "react-icons/fa";
import styles from "./SiteFooter.module.css";

const COLUMNS = [
  {
    title: "Rent",
    links: [
      { href: "/car", label: "All self-drive cars" },
      { href: "/cities/chennai", label: "Car rental in Chennai" },
      { href: "/#offers", label: "Offers" },
      { href: "/host-registration", label: "Become a host" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About us" },
      { href: "/reviews", label: "Reviews" },
      { href: "/blog", label: "Blog" },
      { href: "/contact", label: "Contact us" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "/faq", label: "FAQs" },
      { href: "/insurance", label: "Insurance" },
      { href: "/terms", label: "Terms & conditions" },
      { href: "/privacy", label: "Privacy policy" },
      { href: "/refund", label: "Refund policy" },
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer id="global-footer" className={styles.footer}>
      <div className={styles.card}>
        <div className={styles.top}>
          <div className={styles.brand}>
            <Image src="/brand/logo-white.webp" alt="MM Miles" width={124} height={32} className={styles.logo} />
            <p className={styles.tagline}>Self-drive car rental in Chennai with zero deposit and doorstep delivery.</p>

            <ul className={styles.contact}>
              <li>
                <a href="tel:+918050953607">
                  <Phone size={16} aria-hidden="true" /> +91 80509 53607
                </a>
              </li>
              <li>
                <a href="mailto:support@mmmiles.com">
                  <Mail size={16} aria-hidden="true" /> support@mmmiles.com
                </a>
              </li>
              <li>
                <a href="https://maps.app.goo.gl/gpGgbDxqfo2RMTCG7" target="_blank" rel="noopener noreferrer">
                  <MapPin size={16} aria-hidden="true" />
                  <span>Plot No: 51, VGN Nagar Phase-4, No: 62, Gurusamy Road, Nolambur, Chennai 600095</span>
                </a>
              </li>
            </ul>

            <div className={styles.social}>
              <a href="https://www.instagram.com/mmmiles_official" target="_blank" rel="noopener noreferrer" aria-label="MM Miles on Instagram">
                <FaInstagram />
              </a>
              <a href="https://www.linkedin.com/company/mm-miles/" target="_blank" rel="noopener noreferrer" aria-label="MM Miles on LinkedIn">
                <FaLinkedinIn />
              </a>
              <a href="https://wa.me/918050953607" target="_blank" rel="noopener noreferrer" aria-label="Chat with MM Miles on WhatsApp">
                <FaWhatsapp />
              </a>
            </div>
          </div>

          <nav className={styles.columns} aria-label="Footer">
            {COLUMNS.map((col) => (
              <div key={col.title} className={styles.column}>
                <h2 className={styles.colTitle}>{col.title}</h2>
                <ul>
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href}>{l.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className={styles.bottom}>
          <p>© {new Date().getFullYear()} MM Miles. All rights reserved.</p>
          <p>Open 24×7 · Chennai, Tamil Nadu</p>
        </div>
      </div>
    </footer>
  );
}
