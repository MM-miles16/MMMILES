"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { House, LogIn, Search, Ticket, UserRound } from "lucide-react";
import { searchPageUrl } from "@/lib/searchDefaults";
import { getSession, useSession } from "./useSession";
import styles from "./MobileTabBar.module.css";

// Flows where a bottom bar would get in the way (booking/payment, auth, host and admin tools)
const HIDDEN_ON = ["/checkout", "/payment", "/payment-confirmed", "/booking-success", "/login", "/otp", "/host-registration", "/hub-ops", "/comingsoon"];

const TEXT_INPUT = 'input:not([type="button"]):not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([readonly]), textarea, select';

// App-style bottom navigation, phones only (CSS hides it on larger screens)
export default function MobileTabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const loggedIn = useSession();
  const [dashboardTab, setDashboardTab] = useState(null);
  const [typing, setTyping] = useState(false);
  const hidden = HIDDEN_ON.some((p) => pathname.startsWith(p));

  // Which dashboard tab is open — read from the URL directly (useSearchParams would
  // force every static page to client-render)
  useEffect(() => {
    setDashboardTab(new URLSearchParams(window.location.search).get("tab"));
  }, [pathname]);

  // The dashboard switches sections without a page change; it tells us which one is open
  useEffect(() => {
    const onTab = (e) => setDashboardTab(e.detail);
    window.addEventListener("dashboard-tab", onTab);
    return () => window.removeEventListener("dashboard-tab", onTab);
  }, []);

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

  // "profile" opens the account menu (/dashboard); other keys open that dashboard section
  const accountPath = (tab) => (tab === "profile" ? "/dashboard" : `/dashboard?tab=${tab}`);
  const accountHref = (tab) => (loggedIn ? accountPath(tab) : `/login?redirect=${encodeURIComponent(accountPath(tab))}`);
  const onDashboard = pathname.startsWith("/dashboard");

  const items = [
    { key: "home", label: "Home", href: "/", Icon: House, active: pathname === "/" },
    { key: "search", label: "Search", href: "/search", Icon: Search, active: pathname.startsWith("/search") },
    { key: "orders", label: "My trips", href: accountHref("orders"), Icon: Ticket, active: onDashboard && dashboardTab === "orders" },
    // Logged out: the last tab is "Login"; once logged in it becomes "Profile"
    loggedIn
      ? { key: "profile", label: "Profile", href: accountHref("profile"), Icon: UserRound, active: onDashboard && dashboardTab !== "orders" }
      : { key: "profile", label: "Login", href: accountHref("profile"), Icon: LogIn, active: false },
  ];

  const onTap = (key) => async (e) => {
    // My trips / Profile: log in first. Wait for the session check so a slow answer can't skip login.
    if (key === "orders" || key === "profile") {
      e.preventDefault();
      setDashboardTab(key === "profile" ? null : key);
      const target = accountPath(key);
      router.push((await getSession()) ? target : `/login?redirect=${encodeURIComponent(target)}`);
      return;
    }
    // Search: open the search page with the visitor's current city, area and dates (or the
    // default search: Chennai, T Nagar, tomorrow), read at tap time since the search bar can change them
    if (key === "search") {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      router.push(searchPageUrl());
    }
  };

  return (
    <>
      <div className={styles.spacer} aria-hidden="true" />
      <nav data-mm className={`${styles.bar} ${typing ? styles.away : ""}`} aria-label="Quick navigation">
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
