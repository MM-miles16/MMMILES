"use client";
// Shared pieces for the dashboard sections: auth headers, data loading, formatting, the section
// heading, the sheet (centred card on desktop, bottom sheet on phones) and common states.
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, X } from "lucide-react";
import { toast } from "react-hot-toast";
import { formatINR } from "@/lib/tripPrice";
import styles from "./dashboard.module.css";

/* ---------- auth + data ---------- */

// The login token (localStorage) carries the user id (sub) and phone number
export function readToken() {
  try {
    const token = localStorage.getItem("auth_token");
    if (!token) return null;
    let b64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4) b64 += "=";
    return { token, ...JSON.parse(atob(b64)) };
  } catch (err) {
    console.error("Error parsing token:", err);
    return null;
  }
}

export function authHeaders(extra = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  return { ...extra, ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

// GET a dashboard API. status: loading | ready | setup (tables not created yet) | error
export function useApi(url) {
  const [state, setState] = useState({ status: "loading", data: null });
  const load = useCallback(async () => {
    if (!url) return; // not ready to load yet (e.g. before the login check)
    setState((s) => ({ ...s, status: s.data ? s.status : "loading" }));
    try {
      const res = await fetch(url, { headers: authHeaders(), cache: "no-store" });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
      setState({ status: json?.setup ? "setup" : "ready", data: json });
    } catch (err) {
      console.error(`Error loading ${url}:`, err);
      setState({ status: "error", data: null });
    }
  }, [url]);
  useEffect(() => {
    load();
  }, [load]);
  const replace = useCallback((data) => setState({ status: data?.setup ? "setup" : "ready", data }), []);
  return { ...state, reload: load, replace };
}

// POST/PATCH/DELETE a dashboard API; throws with the server's message
export async function send(url, method, body) {
  const res = await fetch(url, {
    method,
    headers: authHeaders(body ? { "Content-Type": "application/json" } : {}),
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.error || "Something went wrong. Please try again.");
  if (json?.setup) throw new Error("This isn't available right now. Please try again later.");
  return json;
}

// MM Miles on Google (the Business Profile's "write a review" link, also used on the landing page)
export const GOOGLE_REVIEW_URL = "https://g.page/r/Cf04Wx5P5v3vEAE/review";

// Copies right away, inside the click, before a new tab takes focus (the async clipboard API
// fails once the page loses focus). Returns true when the text is on the clipboard.
export function copyNow(text) {
  if (!text) return false;
  const back = document.activeElement;
  let ok = false;
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;pointer-events:none";
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length);
    ok = document.execCommand("copy");
    ta.remove();
  } catch {
    ok = false;
  }
  back?.focus?.({ preventScroll: true });
  if (!ok && navigator.clipboard) {
    navigator.clipboard.writeText(text).catch(() => {});
    ok = true;
  }
  return ok;
}

export async function copyText(text, label = "Copied") {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(label);
  } catch {
    toast.error("Couldn't copy. Please copy it manually.");
  }
}

/* ---------- formatting ---------- */

const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const MO = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Booking times are stored at face value, so they are read in UTC (as the old dashboard did)
export function stamp(iso) {
  const d = new Date(iso);
  if (!iso || isNaN(d)) return null;
  const h = d.getUTCHours();
  const m = d.getUTCMinutes();
  return {
    date: `${WD[d.getUTCDay()]} ${d.getUTCDate()} ${MO[d.getUTCMonth()]}`,
    year: d.getUTCFullYear(),
    time: `${h % 12 || 12}${m ? `:${String(m).padStart(2, "0")}` : ""} ${h < 12 ? "AM" : "PM"}`,
  };
}

// Real timestamps (created_at etc.) in the visitor's own time zone: "17 Nov 2026"
export function day(iso) {
  const d = new Date(iso);
  if (!iso || isNaN(d)) return "";
  return `${d.getDate()} ${MO[d.getMonth()]} ${d.getFullYear()}`;
}

export const rupees = (n) => formatINR(Math.round(Number(n) || 0));

export const amount = (price) => {
  const n = Number(String(price ?? "").replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? rupees(n) : price;
};

export const initials = (first, last) => `${(first || "").trim()[0] || ""}${(last || "").trim()[0] || ""}`.toUpperCase();

/* ---------- section heading ---------- */

export function Head({ title, lead, action, onBack }) {
  return (
    <header className={styles.head}>
      {onBack && (
        <button type="button" className={styles.back} onClick={onBack}>
          <ChevronLeft size={18} strokeWidth={2.2} aria-hidden="true" />
          Account
        </button>
      )}
      <div className={styles.headText}>
        <h1 id="dash-title" className={styles.title}>
          {title}
        </h1>
        {lead && <p className={styles.lead}>{lead}</p>}
      </div>
      {action}
    </header>
  );
}

/* ---------- card: the dashboard's standard tile (same look as Updates) ---------- */

// Icon tile, title (with an optional badge), text, a small meta line and optional actions.
// With href or onClick (and no actions) the whole card is a link or a button.
// `panel`: the wide "review card" look (big white icon tile, soft glow, actions on the right),
// used for lists of one item per row (coupons, payments, addresses).
export function Card({ Icon, icon, title, badge, children, meta, actions, href, onClick, newTab, tone, wide, muted, add, panel, heading = "h3", className = "" }) {
  const H = heading;
  const cls = [styles.card, panel ? styles.cardPanel : "", href || onClick ? styles.cardLink : "", wide ? styles.cardWide : "", muted ? styles.cardMuted : "", add ? styles.cardAdd : "", className].filter(Boolean).join(" ");
  const toneCls = { dark: styles.iconDark, ok: styles.iconOk, muted: styles.iconMuted, plain: styles.iconPlain }[tone] || "";
  const inner = (
    <>
      <span className={`${styles.updateIcon} ${panel ? styles.panelIcon : ""} ${toneCls}`} aria-hidden="true">
        {icon || <Icon size={panel ? 24 : 19} strokeWidth={panel ? 1.9 : 2} />}
      </span>
      <div className={styles.cardBody}>
        <div className={styles.cardHead}>
          <H className={styles.updateTitle}>{title}</H>
          {badge}
        </div>
        {children && <div className={styles.cardText}>{children}</div>}
        {meta && <span className={styles.cardMeta}>{meta}</span>}
        {actions && !panel && <div className={styles.cardActions}>{actions}</div>}
      </div>
      {actions && panel && <div className={styles.panelActions}>{actions}</div>}
    </>
  );
  if (href)
    return (
      <a href={href} className={cls} onClick={onClick} {...(newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        {inner}
      </a>
    );
  if (onClick)
    return (
      <button type="button" className={cls} onClick={onClick}>
        {inner}
      </button>
    );
  return <article className={cls}>{inner}</article>;
}

/* ---------- states ---------- */

export function Empty({ Icon, title, text, children }) {
  return (
    <div className={styles.empty}>
      <span className={styles.emptyIcon} aria-hidden="true">
        <Icon size={24} strokeWidth={2} />
      </span>
      <h2 className={styles.emptyTitle}>{title}</h2>
      {text && <p className={styles.emptyText}>{text}</p>}
      {children}
    </div>
  );
}

export function LoadError({ onRetry }) {
  return (
    <div className={styles.notice} role="alert">
      <span>We couldn&apos;t load this right now.</span>
      <button type="button" className={`${styles.btnSm} ${styles.btnLine}`} onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}

export function SkeletonRows({ count = 3, height = 84 }) {
  return (
    <div className={styles.stack} aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={`${styles.skelBlock} ${styles.shimmer}`} style={{ height }} />
      ))}
    </div>
  );
}

/* ---------- sheet: centred card on desktop, bottom sheet on phones ---------- */

export function Sheet({ open, onClose, title, lead, children, footer, onSubmit, wide = false }) {
  const panelRef = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!open) return;
    setScrolled(false);
    const back = document.activeElement;
    document.body.classList.add("sheet-open"); // hides the chat bubble
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Keyboards and mice start in the first field. Touch screens don't, so the on-screen keyboard
    // doesn't cover the sheet before the person has seen it.
    const touch = window.matchMedia("(pointer: coarse)").matches;
    const t = setTimeout(() => {
      const panel = panelRef.current;
      const first = panel?.querySelector(touch ? "[data-autofocus]" : "input:not([type=radio]), textarea, [data-autofocus]");
      (first || panel)?.focus({ preventScroll: true });
    }, 40);
    const onKey = (e) => e.key === "Escape" && closeRef.current();
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      document.body.classList.remove("sheet-open");
      document.body.style.overflow = prev;
      back?.focus?.();
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;
  const Tag = onSubmit ? "form" : "div";

  return createPortal(
    <div className={styles.sheetRoot} data-mm>
      <div className={styles.sheetBackdrop} onClick={onClose} aria-hidden="true" />
      <Tag
        ref={panelRef}
        className={`${styles.sheet} ${wide ? styles.sheetWide : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        aria-describedby={lead ? "sheet-lead" : undefined}
        tabIndex={-1}
        onSubmit={onSubmit}
        noValidate={onSubmit ? true : undefined}
      >
        <span className={styles.handle} aria-hidden="true" />
        <div className={`${styles.sheetHead} ${scrolled ? styles.sheetHeadLine : ""}`}>
          <div className={styles.sheetHeadText}>
            <h2 id="sheet-title" className={styles.sheetTitle}>
              {title}
            </h2>
            {lead && (
              <p id="sheet-lead" className={styles.sheetLead}>
                {lead}
              </p>
            )}
          </div>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
            <X size={18} strokeWidth={2.2} />
          </button>
        </div>
        <div className={styles.sheetBody} onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 2)}>
          {children}
        </div>
        {footer && <div className={styles.sheetFoot}>{footer}</div>}
      </Tag>
    </div>,
    document.body
  );
}
