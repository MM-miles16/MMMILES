"use client";
// Customer dashboard, in the landing page's design (ui.homeType gives it the homepage's type sizes
// and laptop scale). Eleven sections in three groups:
//   Travel  — My trips, Payments, My coupons, Car reviews
//   Account — Profile, Documents (DigiLocker), Saved addresses
//   More    — Refer & earn, Updates, Host your car, Support
// Desktop: a sticky sidebar beside the open section (My trips by default).
// Phones/tablets (app-style): /dashboard is an account menu; each section opens full-screen with a
// back button. Sections are in the URL (?tab=…) so the tab bar, checkout and login link straight in.
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BadgeCheck,
  Bell,
  ChevronRight,
  CreditCard,
  Gift,
  KeyRound,
  LifeBuoy,
  LogOut,
  MapPin,
  Star,
  Ticket,
  TicketPercent,
  UserRound,
} from "lucide-react";
import { makeAuthenticatedRequest } from "../../lib/customSupabaseClient";
import ui from "../components/landing/ui.module.css";
import { authHeaders, initials, readToken, useApi } from "./shared";
import Trips from "./sections/Trips";
import Payments from "./sections/Payments";
import Coupons from "./sections/Coupons";
import Reviews from "./sections/Reviews";
import Profile from "./sections/Profile";
import Documents from "./sections/Documents";
import Addresses from "./sections/Addresses";
import Referrals from "./sections/Referrals";
import { Host, Support, Updates } from "./sections/More";
import styles from "./dashboard.module.css";

const GROUPS = [
  {
    title: "Travel",
    items: [
      { id: "orders", label: "My trips", Icon: Ticket },
      { id: "payments", label: "Payments", Icon: CreditCard },
      { id: "coupons", label: "My coupons", Icon: TicketPercent },
      { id: "reviews", label: "Car reviews", Icon: Star },
    ],
  },
  {
    title: "Account",
    items: [
      { id: "profile", label: "Profile", Icon: UserRound },
      { id: "documents", label: "Documents", Icon: BadgeCheck },
      { id: "addresses", label: "Saved addresses", Icon: MapPin },
    ],
  },
  {
    title: "More",
    items: [
      { id: "referrals", label: "Refer & earn", Icon: Gift },
      { id: "announcement", label: "Updates", Icon: Bell },
      { id: "host", label: "Host your car", Icon: KeyRound },
      { id: "support", label: "Support", Icon: LifeBuoy },
    ],
  },
];
const TAB_IDS = GROUPS.flatMap((g) => g.items.map((i) => i.id));

// Phones and tablets get the app-style account menu
function useCompact() {
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const on = () => setCompact(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return compact;
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const compact = useCompact();
  const [authReady, setAuthReady] = useState(false);
  const [active, setActive] = useState(null);
  const [tripFilter, setTripFilter] = useState("all");
  const [callback, setCallback] = useState(null); // DigiLocker result (?status=…&error=…)
  const [trips, setTrips] = useState({ status: "loading", list: [] });
  const [profile, setProfile] = useState({ status: "loading", data: null, phone: "" });

  // Logged-in only
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/session");
        const data = res.ok ? await res.json() : null;
        if (data?.authenticated) setAuthReady(true);
        else router.push("/login?redirect=/dashboard");
      } catch {
        router.push("/login?redirect=/dashboard");
      }
    })();
  }, [router]);

  // ?tab=… opens that section; no tab = account menu (phones) or My trips (desktop)
  useEffect(() => {
    const tab = searchParams.get("tab");
    setActive(TAB_IDS.includes(tab) ? tab : null);
    const status = searchParams.get("status");
    if (tab === "documents" && (status === "success" || status === "failed")) {
      setCallback({ status, error: searchParams.get("error") });
    }
  }, [searchParams]);

  const loadTrips = useCallback(async () => {
    setTrips((t) => ({ ...t, status: "loading" }));
    try {
      const res = await fetch("/api/dashboard/bookings", { headers: authHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const list = await res.json();
      setTrips({ status: "ready", list: Array.isArray(list) ? list : [] });
    } catch (err) {
      console.error("Error fetching trips:", err);
      setTrips({ status: "error", list: [] });
    }
  }, []);

  const loadProfile = useCallback(async () => {
    const me = readToken();
    if (!me?.sub) {
      setProfile({ status: "error", data: null, phone: "" });
      return;
    }
    try {
      const rows = await makeAuthenticatedRequest("GET", `customers?user_id=eq.${me.sub}&select=*`);
      const row = rows?.[0] || null;
      setProfile({ status: "ready", data: row, phone: row?.phone || me.phone_number || "" });
    } catch (err) {
      console.error("Error fetching profile:", err);
      setProfile({ status: "error", data: null, phone: me.phone_number || "" });
    }
  }, []);

  useEffect(() => {
    if (!authReady) return;
    loadTrips();
    loadProfile();
  }, [authReady, loadTrips, loadProfile]);

  // Verification status for the menu, sidebar and profile (null until known / not set up yet)
  const kycApi = useApi(authReady ? "/api/dashboard/kyc" : null);
  const kyc = kycApi.status === "ready" ? kycApi.data : null;

  // Open a section (or the menu with null); keep the URL and the phone tab bar in step
  const go = (id, filter) => {
    setActive(id);
    if (filter) setTripFilter(filter);
    const url = id ? `/dashboard?tab=${id}` : "/dashboard";
    if (compact) router.push(url);
    else router.replace(url, { scroll: false });
    window.dispatchEvent(new CustomEvent("dashboard-tab", { detail: id }));
    window.scrollTo({ top: 0 });
  };
  const toMenu = compact ? () => go(null) : undefined;

  const clearCallback = () => {
    setCallback(null);
    router.replace("/dashboard?tab=documents", { scroll: false });
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_profile");
    window.dispatchEvent(new Event("auth-change"));
    window.location.href = "/login";
  };

  const counts = useMemo(() => {
    const c = { all: trips.list.length, upcoming: 0, completed: 0, cancelled: 0 };
    for (const t of trips.list) if (c[t.status] !== undefined) c[t.status]++;
    return c;
  }, [trips.list]);

  if (!authReady) {
    return (
      <div className={styles.boot} aria-busy="true" aria-label="Loading your dashboard">
        <span className={styles.spinner} />
      </div>
    );
  }

  const first = profile.data?.first_name?.trim();
  const name = `${profile.data?.first_name || ""} ${profile.data?.last_name || ""}`.trim();
  const shown = active || (compact ? null : "orders");

  // Small live hints next to menu items
  const hint = (id) => {
    if (id === "orders") return counts.upcoming ? `${counts.upcoming} upcoming` : null;
    if (id === "documents" && kyc) return kyc.licence?.verified ? "Verified" : "Verify now";
    if (id === "referrals") return "Earn ₹200";
    return null;
  };

  const me = (
    <div className={styles.me}>
      <span className={styles.avatar} aria-hidden="true">
        {initials(profile.data?.first_name, profile.data?.last_name) || <UserRound size={22} strokeWidth={2} />}
      </span>
      <span className={styles.meText}>
        <span className={styles.hello}>{first ? `Hi, ${first}` : "Welcome back"}</span>
        <span className={styles.mePhone}>{profile.phone || " "}</span>
      </span>
      {kyc && (
        <button type="button" className={`${styles.meBadge} ${kyc.licence?.verified ? styles.meBadgeOk : ""}`} onClick={() => go("documents")}>
          <BadgeCheck size={14} strokeWidth={2.2} aria-hidden="true" />
          {kyc.licence?.verified ? "Verified" : "Verify"}
        </button>
      )}
    </div>
  );

  let section = null;
  if (shown === "orders") section = <Trips trips={trips} counts={counts} filter={tripFilter} setFilter={setTripFilter} reload={loadTrips} onBack={toMenu} onRate={() => go("reviews")} />;
  else if (shown === "payments") section = <Payments trips={trips} onBack={toMenu} />;
  else if (shown === "coupons") section = <Coupons onBack={toMenu} go={go} />;
  else if (shown === "reviews") section = <Reviews onBack={toMenu} />;
  else if (shown === "profile")
    section = <Profile profile={profile} name={name} counts={counts} tripsReady={trips.status === "ready"} kyc={kyc} onBack={toMenu} go={go} onRetry={loadProfile} onSaved={loadProfile} />;
  else if (shown === "documents") section = <Documents onBack={toMenu} callback={callback} onClearCallback={clearCallback} />;
  else if (shown === "addresses") section = <Addresses onBack={toMenu} profile={profile} onProfileSaved={loadProfile} />;
  else if (shown === "referrals") section = <Referrals onBack={toMenu} go={go} />;
  else if (shown === "announcement") section = <Updates onBack={toMenu} />;
  else if (shown === "host") section = <Host onBack={toMenu} />;
  else if (shown === "support") section = <Support onBack={toMenu} />;

  return (
    <div className={`${ui.homeType} ${styles.page}`} data-mm>
      {/* ── Desktop sidebar ── */}
      <aside className={styles.side}>
        {me}
        <nav className={styles.nav} aria-label="Dashboard sections">
          {GROUPS.map((g) => (
            <div key={g.title} className={styles.navGroup}>
              <span className={styles.navGroupTitle}>{g.title}</span>
              {g.items.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  type="button"
                  className={`${styles.navItem} ${shown === id ? styles.navActive : ""}`}
                  aria-current={shown === id ? "page" : undefined}
                  onClick={() => go(id)}
                >
                  <span className={styles.navIcon} aria-hidden="true">
                    <Icon size={16} strokeWidth={2} />
                  </span>
                  <span>{label}</span>
                  {id === "orders" && counts.upcoming > 0 && <span className={styles.navCount}>{counts.upcoming}</span>}
                  {id === "documents" && kyc && !kyc.licence?.verified && <span className={styles.navFlag}>Verify</span>}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className={styles.sideFoot}>
          <button type="button" className={styles.logout} onClick={logout}>
            <LogOut size={18} strokeWidth={2} aria-hidden="true" />
            Log out
          </button>
          <p className={styles.logoutNote}>You&apos;ll need an OTP to log in again.</p>
        </div>
      </aside>

      <main className={styles.main}>
        {shown === null ? (
          /* ── Phones/tablets: the account menu ── */
          <div className={styles.view} key="menu">
            <h1 id="dash-title" className={styles.srOnly}>
              Your account
            </h1>
            {me}
            {kyc && !kyc.licence?.verified && (
              <button type="button" className={styles.menuCta} onClick={() => go("documents")}>
                <span className={styles.nudgeIcon} aria-hidden="true">
                  <BadgeCheck size={20} strokeWidth={2} />
                </span>
                <span className={styles.nudgeText}>
                  <strong>Verify your driving licence</strong>
                  <span>Needed to book. Takes a minute with DigiLocker.</span>
                </span>
                <ChevronRight className={styles.chev} size={18} aria-hidden="true" />
              </button>
            )}
            {GROUPS.map((g) => (
              <div key={g.title} className={styles.menuGroup}>
                <h2 className={styles.subhead}>{g.title}</h2>
                <div className={styles.group}>
                  {g.items.map(({ id, label, Icon }) => (
                    <button key={id} type="button" className={`${styles.row} ${styles.rowLink}`} onClick={() => go(id)}>
                      <span className={styles.rowIcon} aria-hidden="true">
                        <Icon size={18} strokeWidth={2} />
                      </span>
                      <span className={styles.rowText}>
                        <span className={styles.rowTitle}>{label}</span>
                      </span>
                      {hint(id) && <span className={styles.rowHint}>{hint(id)}</span>}
                      <ChevronRight className={styles.chev} size={18} aria-hidden="true" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <button type="button" className={styles.logoutRow} onClick={logout}>
              <LogOut size={18} strokeWidth={2} aria-hidden="true" />
              Log out
            </button>
            <p className={styles.logoutNote}>You&apos;ll need an OTP to log in again.</p>
          </div>
        ) : (
          <div key={shown} className={styles.view}>
            {section}
          </div>
        )}
      </main>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={null}>
      <DashboardContent />
    </Suspense>
  );
}
