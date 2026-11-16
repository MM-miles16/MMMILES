"use client";
// Updates (announcements), Host your car and Support.
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CircleHelp, Clock3, Handshake, KeyRound, Mail, Megaphone, MessageCircle, Phone, ShieldCheck, Wallet } from "lucide-react";
import HostMap from "../../components/landing/HostMap";
import { Card, Head, MO } from "../shared";
import styles from "../dashboard.module.css";

/* ---------- Updates ---------- */

export function Updates({ onBack }) {
  const [state, setState] = useState({ status: "loading", list: [] });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/dashboard/announcements");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const when = (s) => {
          const [d, m, y] = String(s || "").split("/").map(Number);
          return y ? new Date(y, m - 1, d).getTime() : 0;
        };
        setState({ status: "ready", list: (Array.isArray(data) ? data : []).sort((a, b) => when(b.date) - when(a.date)) });
      } catch (err) {
        console.error("Error fetching announcements:", err);
        setState({ status: "error", list: [] });
      }
    })();
  }, []);

  const pretty = (s) => {
    const [d, m, y] = String(s || "").split("/").map(Number);
    return y ? `${d} ${MO[m - 1]} ${y}` : s;
  };

  return (
    <section aria-labelledby="dash-title">
      <Head title="Updates" lead="News and service updates from MM Miles." onBack={onBack} />
      {state.status === "loading" && (
        <div className={styles.updates} aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`${styles.update} ${styles.shimmer}`} style={{ minHeight: 110 }} />
          ))}
        </div>
      )}
      {state.status === "error" && <p className={styles.lead}>We couldn&apos;t load updates right now.</p>}
      {state.status === "ready" && (
        <div className={styles.updates}>
          {state.list.map((n) => (
            <article key={n.id} className={styles.update}>
              <span className={styles.updateIcon} aria-hidden="true">
                <Megaphone size={19} strokeWidth={2} />
              </span>
              <div className={styles.updateBody}>
                <h2 className={styles.updateTitle}>{n.title}</h2>
                <p className={styles.updateText}>{n.desc}</p>
                {n.date && <span className={styles.updateDate}>{pretty(n.date)}</span>}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

/* ---------- Host your car ---------- */

const HOST_POINTS = [
  { Icon: Wallet, title: "Transparent, timely earnings", text: "See what every booking earns you." },
  { Icon: Handshake, title: "A partnership, not just a listing", text: "We work with you on pricing and care." },
  { Icon: KeyRound, title: "Your car is an asset", text: "Treated with the care it deserves." },
  { Icon: ShieldCheck, title: "You stay in control", text: "Your car, your rules, guaranteed." },
];

export function Host({ onBack }) {
  return (
    <section aria-labelledby="dash-title">
      {onBack && <Head title="Host your car" onBack={onBack} />}
      <div className={styles.hostPanel}>
        <div className={styles.hostCopy}>
          <h1 id={onBack ? undefined : "dash-title"} className={styles.hostTitle}>
            Own a car? Let it <span>earn for you</span>
          </h1>
          <p className={styles.hostLead}>Built for hosts and powered by trust. Your safety, control and earnings come before everything else.</p>
          <ul className={styles.hostPoints}>
            {HOST_POINTS.map(({ Icon, title, text }) => (
              <li key={title}>
                <span className={styles.hostIcon} aria-hidden="true">
                  <Icon size={18} strokeWidth={2} />
                </span>
                <span>
                  <strong>{title}</strong>
                  <span>{text}</span>
                </span>
              </li>
            ))}
          </ul>
          <Link href="/host-registration" className={`${styles.btn} ${styles.btnDark}`}>
            Become a host
            <ArrowRight size={17} strokeWidth={2} aria-hidden="true" />
          </Link>
        </div>
        <HostMap id="host-map-dashboard" className={styles.hostMap} />
      </div>
    </section>
  );
}

/* ---------- Support ---------- */

const SUPPORT_EMAIL = "support@mmmiles.com";
const USER_HELPLINE = "8050953607";
const HOST_HELPLINE = "8050953609";

export function Support({ onBack }) {
  const openChat = () => window.dispatchEvent(new Event("open-chat"));
  const cards = [
    { Icon: MessageCircle, title: "Chat with us", text: "Ask our assistant about bookings, trips, payments or hosting.", meta: "Opens the chat", onClick: openChat, tone: "dark" },
    { Icon: Mail, title: "Mail us", text: SUPPORT_EMAIL, meta: "We reply within 12 hours", href: `mailto:${SUPPORT_EMAIL}` },
    { Icon: Phone, title: "Customer helpline", text: `+91 ${USER_HELPLINE.slice(0, 5)} ${USER_HELPLINE.slice(5)}`, meta: "For bookings and trips", href: `tel:+91${USER_HELPLINE}` },
    { Icon: KeyRound, title: "Host helpline", text: `+91 ${HOST_HELPLINE.slice(0, 5)} ${HOST_HELPLINE.slice(5)}`, meta: "For car owners", href: `tel:+91${HOST_HELPLINE}` },
    { Icon: CircleHelp, title: "FAQs", text: "Quick answers to the questions renters ask most.", meta: "Opens the FAQ page", href: "/faq" },
  ];
  return (
    <section aria-labelledby="dash-title">
      <Head title="Support" lead="Help with bookings, trips and payments." onBack={onBack} />
      <div className={styles.cards}>
        {cards.map(({ text, ...c }) => (
          <Card key={c.title} {...c}>
            {text}
          </Card>
        ))}
      </div>
      <p className={styles.promise}>
        <Clock3 size={15} strokeWidth={2} aria-hidden="true" />
        We respond to mails within 12 hours
      </p>
    </section>
  );
}
