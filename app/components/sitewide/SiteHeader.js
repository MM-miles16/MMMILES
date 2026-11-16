"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BadgePercent, ChevronRight, House, Info, KeyRound, LogIn, LogOut, Menu, MessageCircle, X } from "lucide-react";
import { getSession, useSession } from "./useSession";
import styles from "./SiteHeader.module.css";

// Desktop: centred between the logo and the login button
const PRIMARY_LINKS = [
  { href: "/about", label: "About us" },
  { href: "/faq", label: "Help" },
  { href: "/host-registration", label: "Become a host" },
  { href: "/#offers", label: "Offers" },
];

// Phones and tablets: the menu holds just these, plus "Chat with us" (login sits beside the menu button)
const MENU_LINKS = [
  { href: "/about", label: "About us", Icon: Info },
  { href: "/host-registration", label: "Become a host", Icon: KeyRound },
  { href: "/#offers", label: "Offers", Icon: BadgePercent },
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
    document.body.classList.add("menu-open"); // hides the floating chat bubble behind the drawer
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
      document.body.classList.remove("menu-open");
    };
  }, [menuOpen]);

  // Wait for the session check, so a slow answer can't send a logged-in visitor to the login page
  const goToAccount = async () => {
    setMenuOpen(false);
    router.push((await getSession()) ? "/dashboard" : "/login");
  };

  // Same steps as the dashboard's logout; leave account pages, stay anywhere else
  const logout = async () => {
    setMenuOpen(false);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_profile");
    window.dispatchEvent(new Event("auth-change"));
    if (["/dashboard", "/profile", "/checkout"].some((p) => pathname.startsWith(p))) router.push("/");
  };

  // Opens the site chat (ChatSupport listens for this event)
  const openChat = () => {
    setMenuOpen(false);
    window.dispatchEvent(new Event("open-chat"));
  };

  const isActive = (href) => !href.includes("#") && pathname.startsWith(href);
  const onDashboard = pathname.startsWith("/dashboard");

  return (
    <header id="global-header" data-mm className={`${styles.header} ${scrolled || menuOpen ? styles.scrolled : ""}`}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo} aria-label="MM Miles home">
          <Image src="/brand/logo-midnight.webp" alt="MM Miles" width={108} height={28} priority />
        </Link>

        {/* In the dashboard the header is just the logo and a Home button (no site links or menu) */}
        {!onDashboard && (
          <nav className={styles.nav} aria-label="Main">
            {PRIMARY_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className={`${styles.navLink} ${isActive(l.href) ? styles.navLinkActive : ""}`}>
                {l.label}
              </Link>
            ))}
          </nav>
        )}

        <div className={`${styles.actions} ${onDashboard ? styles.actionsEnd : ""}`}>
          {onDashboard ? (
            <Link href="/" className={`${styles.accountBtn} ${styles.homeBtn}`}>
              <House size={17} strokeWidth={2} aria-hidden="true" />
              Home
            </Link>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>

      {!onDashboard && (
      <>
      <div id="mobile-menu" className={`${styles.sheet} ${menuOpen ? styles.sheetOpen : ""}`} aria-hidden={!menuOpen}>
        <p className={styles.sheetCaption} style={{ "--i": 0 }}>
          Menu
        </p>
        <nav className={styles.sheetNav} aria-label="Mobile">
          {MENU_LINKS.map(({ href, label, Icon }, i) => (
            <Link
              key={href}
              href={href}
              className={styles.sheetLink}
              style={{ "--i": i + 1 }}
              tabIndex={menuOpen ? 0 : -1}
              onClick={() => setMenuOpen(false)}
            >
              <span className={styles.sheetIcon}>
                <Icon size={16} strokeWidth={2} aria-hidden="true" />
              </span>
              {label}
              <ChevronRight size={16} className={styles.sheetChevron} aria-hidden="true" />
            </Link>
          ))}
          <button
            type="button"
            className={styles.sheetLink}
            style={{ "--i": MENU_LINKS.length + 1 }}
            tabIndex={menuOpen ? 0 : -1}
            onClick={openChat}
          >
            <span className={styles.sheetIcon}>
              <MessageCircle size={16} strokeWidth={2} aria-hidden="true" />
            </span>
            Chat with us
            <ChevronRight size={16} className={styles.sheetChevron} aria-hidden="true" />
          </button>
        </nav>

        <div className={styles.sheetFoot} style={{ "--i": MENU_LINKS.length + 2 }}>
          {isLoggedIn ? (
            <>
              <button type="button" className={styles.sheetAuth} tabIndex={menuOpen ? 0 : -1} onClick={logout}>
                <LogOut size={16} strokeWidth={2} aria-hidden="true" /> Log out
              </button>
              <p className={styles.sheetNote}>You&apos;ll need an OTP to log in again.</p>
            </>
          ) : (
            <>
              <button
                type="button"
                className={`${styles.sheetAuth} ${styles.sheetAuthPrimary}`}
                tabIndex={menuOpen ? 0 : -1}
                onClick={goToAccount}
              >
                <LogIn size={16} strokeWidth={2} aria-hidden="true" /> Log in
              </button>
              <p className={styles.sheetNote}>We&apos;ll send an OTP to your phone.</p>
            </>
          )}
        </div>
      </div>
      <div className={`${styles.backdrop} ${menuOpen ? styles.backdropOpen : ""}`} onClick={() => setMenuOpen(false)} aria-hidden="true" />
      </>
      )}
    </header>
  );
}
