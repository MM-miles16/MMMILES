"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Search, Ticket, UserRound } from "lucide-react";
import { useSession } from "./useSession";
import styles from "./MobileTabBar.module.css";

// Flows where a bottom bar would get in the way (booking/payment, auth, host and admin tools)
const HIDDEN_ON = ["/checkout", "/payment", "/payment-confirmed", "/booking-success", "/login", "/otp", "/host-registration", "/hub-ops", "/comingsoon"];

const TEXT_INPUT = 'input:not([type="button"]):not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([readonly]), textarea, select';

// App-style bottom navigation, phones only (CSS hides it on larger screens)
export default function MobileTabBar() {
  const pathname = usePathname();
  const loggedIn = useSession();
  const [dashboardTab, setDashboardTab] = useState(null);
  const [typing, setTyping] = useState(false);
  const hidden = HIDDEN_ON.some((p) => pathname.startsWith(p));

  // Which dashboard tab is open — read from the URL directly (useSearchParams would
  // force every static page to client-render)
  useEffect(() => {
    setDashboardTab(new URLSearchParams(window.location.search).get("tab"));
  }, [pathname]);

  // Lets the chat bubble move up above the bar
  useEffect(() => {
    document.body.classList.toggle("has-tabbar", !hidden);
    return () => document.body.classList.remove("has-tabbar");
  }, [hidden]);

  // Slide away while the on-screen keyboard is up, so it never covers a field
  useEffect(() => {
    const onFocusIn = (e) => setTyping(e.target.matches?.(TEXT_INPUT) ?? false);
    const onFocusOut = () => setTyping(false);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, []);

  if (hidden) return null;

  const accountHref = (tab) =>
    loggedIn ? `/dashboard?tab=${tab}` : `/login?redirect=${encodeURIComponent(`/dashboard?tab=${tab}`)}`;
  const onDashboard = pathname.startsWith("/dashboard");

  const items = [
    { key: "home", label: "Home", href: "/", Icon: House, active: pathname === "/" },
    { key: "search", label: "Search", href: "/#search", Icon: Search, active: pathname.startsWith("/search") },
    { key: "orders", label: "My trips", href: accountHref("orders"), Icon: Ticket, active: onDashboard && dashboardTab === "orders" },
    { key: "profile", label: "Profile", href: accountHref("profile"), Icon: UserRound, active: onDashboard && dashboardTab !== "orders" },
  ];

  const onTap = (key) => (e) => {
    if (key === "orders" || key === "profile") setDashboardTab(key);
    // On the homepage, "Search" jumps to the search box instead of reloading
    if (key === "search" && pathname === "/") {
      e.preventDefault();
      const target = document.getElementById("search");
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
      setTimeout(() => target?.querySelector('[role="button"][tabindex="0"]')?.focus({ preventScroll: true }), 450);
    }
  };

  return (
    <>
      <div className={styles.spacer} aria-hidden="true" />
      <nav className={`${styles.bar} ${typing ? styles.away : ""}`} aria-label="Quick navigation">
        {items.map(({ key, label, href, Icon, active }) => (
          <Link
            key={key}
            href={href}
            className={`${styles.item} ${active ? styles.active : ""}`}
            aria-current={active ? "page" : undefined}
            onClick={onTap(key)}
          >
            <Icon size={20} strokeWidth={active ? 2.4 : 2} aria-hidden="true" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
