"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Phone, X } from "lucide-react";
import { useSession } from "./useSession";
import styles from "./SiteHeader.module.css";

const PHONE = "+918050953607";

const PRIMARY_LINKS = [
  { href: "/car", label: "Cars" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#offers", label: "Offers" },
  { href: "/host-registration", label: "Become a host" },
  { href: "/faq", label: "Help" },
];

// Extra links that only fit in the mobile menu
const MORE_LINKS = [
  { href: "/about", label: "About us" },
  { href: "/reviews", label: "Reviews" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact us" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const isLoggedIn = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu on navigation and on Escape; lock page scroll while open
  useEffect(() => setMenuOpen(false), [pathname]);
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
    };
  }, [menuOpen]);

  const goToAccount = () => {
    setMenuOpen(false);
    router.push(isLoggedIn ? "/dashboard" : "/login");
  };

  const isActive = (href) => !href.includes("#") && pathname.startsWith(href);

  return (
    <header id="global-header" className={`${styles.header} ${scrolled || menuOpen ? styles.scrolled : ""}`}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo} aria-label="MM Miles home">
          <Image src="/brand/logo-midnight.webp" alt="MM Miles" width={108} height={28} priority />
        </Link>

        <nav className={styles.nav} aria-label="Main">
          {PRIMARY_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={`${styles.navLink} ${isActive(l.href) ? styles.navLinkActive : ""}`}>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className={styles.actions}>
          <a href={`tel:${PHONE}`} className={styles.iconBtn} aria-label="Call MM Miles">
            <Phone size={18} strokeWidth={2} />
          </a>
          <button type="button" className={styles.accountBtn} onClick={goToAccount}>
            {isLoggedIn ? "My account" : "Log in"}
          </button>
          <button
            type="button"
            className={`${styles.iconBtn} ${styles.menuBtn}`}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? <X size={20} strokeWidth={2} /> : <Menu size={20} strokeWidth={2} />}
          </button>
        </div>
      </div>

      <div id="mobile-menu" className={`${styles.sheet} ${menuOpen ? styles.sheetOpen : ""}`} aria-hidden={!menuOpen}>
        <nav className={styles.sheetNav} aria-label="Mobile">
          {[...PRIMARY_LINKS, ...MORE_LINKS].map((l) => (
            <Link key={l.href} href={l.href} className={styles.sheetLink} tabIndex={menuOpen ? 0 : -1} onClick={() => setMenuOpen(false)}>
              {l.label}
            </Link>
          ))}
        </nav>
        <button type="button" className={styles.sheetAccount} tabIndex={menuOpen ? 0 : -1} onClick={goToAccount}>
          {isLoggedIn ? "My account" : "Log in / Sign up"}
        </button>
      </div>
      <div className={`${styles.backdrop} ${menuOpen ? styles.backdropOpen : ""}`} onClick={() => setMenuOpen(false)} aria-hidden="true" />
    </header>
  );
}
