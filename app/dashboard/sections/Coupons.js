"use client";
// My coupons, as cards in the Updates style: the automatic perk (₹350 off the first trip, or a free
// hour on every trip after), personal rewards (referral bonuses), public offers with the code to
// copy, then coupons already used on past bookings.
import { CircleCheck, Clock, Copy, Gift, Sparkles, TicketPercent } from "lucide-react";
import { Card, copyText, day, Empty, Head, LoadError, rupees, SkeletonRows, useApi } from "../shared";
import { useSearchLink } from "./Trips";
import styles from "../dashboard.module.css";

function valueText(c) {
  return c.type === "percentage" ? `${c.value}%` : rupees(c.value);
}

function terms(c) {
  const out = [];
  if (c.minAmount > 0) out.push(`On trips of ${rupees(c.minAmount)} or more.`);
  if (c.type === "percentage" && c.maxDiscount) out.push(`Up to ${rupees(c.maxDiscount)} off.`);
  return out.join(" ");
}

// A coupon card. c: { code, type, value, description, text?, meta?, minAmount, maxDiscount,
// validUntil, personal }. `used` ({ bookingCode }) shows it as spent instead of the code.
export function CouponCard({ c, onUse, used, panel = false }) {
  const text = c.text ?? [c.description, terms(c)].filter(Boolean).join(" ");
  const meta = c.meta ?? (c.validUntil ? `Valid till ${day(c.validUntil)}` : "No expiry");
  return (
    <Card
      panel={panel}
      Icon={used ? CircleCheck : c.personal ? Gift : TicketPercent}
      tone={used ? "muted" : undefined}
      muted={Boolean(used)}
      title={`${valueText(c)} off`}
      badge={c.personal && !used ? <span className={`${styles.chip} ${styles.chipUpcoming}`}>Yours</span> : null}
      meta={meta}
      actions={
        used ? (
          <span className={`${styles.chip} ${styles.chipMuted}`}>
            <CircleCheck size={14} strokeWidth={2.2} aria-hidden="true" />
            Used on {used.bookingCode}
          </span>
        ) : (
          <>
            <button type="button" className={styles.code} onClick={() => copyText(c.code, `${c.code} copied`)} aria-label={`Copy code ${c.code}`}>
              <span>{c.code}</span>
              <Copy size={14} strokeWidth={2} aria-hidden="true" />
            </button>
            <a href="/search" className={`${panel ? styles.btn : styles.btnSm} ${styles.btnDark}`} onClick={onUse}>
              Book now
            </a>
          </>
        )
      }
    >
      {text}
    </Card>
  );
}

// The automatic offer for this customer's next booking
function PerkCard({ perk, onUse }) {
  const welcome = perk.kind === "welcome";
  return (
    <Card
      panel
      Icon={welcome ? Sparkles : Clock}
      tone="dark"
      title={welcome ? `${rupees(perk.amount)} off your first trip` : "1 free hour on every trip"}
      badge={<span className={`${styles.chip} ${styles.chipPaid}`}>Automatic</span>}
      meta="No code needed, applied at checkout"
      actions={
        <a href="/search" className={`${styles.btn} ${styles.btnDark}`} onClick={onUse}>
          Book a car
        </a>
      }
    >
      {welcome ? "If you also have a coupon that saves more, checkout uses that instead." : "One hour of rent on every booking is on us. You can add a coupon on top."}
    </Card>
  );
}

export default function Coupons({ onBack, go }) {
  const api = useApi("/api/dashboard/coupons");
  const toSearch = useSearchLink();
  const d = api.data || {};
  const mine = d.mine || [];
  const offers = d.offers || [];
  const used = d.used || [];

  return (
    <section aria-labelledby="dash-title">
      <Head title="My coupons" lead="Offers and rewards you can use at checkout." onBack={onBack} />

      {api.status === "loading" && <SkeletonRows count={2} height={150} />}
      {api.status === "error" && <LoadError onRetry={api.reload} />}

      {(d.perk || mine.length > 0) && (
        <>
          <h2 className={`${styles.subhead} ${styles.subheadFirst}`}>On your next booking</h2>
          <div className={styles.panels}>
            {d.perk && <PerkCard perk={d.perk} onUse={toSearch} />}
            {mine.map((c) => (
              <CouponCard key={c.code} c={c} onUse={toSearch} panel />
            ))}
          </div>
        </>
      )}

      {api.status === "ready" && offers.length > 0 && (
        <>
          <h2 className={styles.subhead}>Offers for you</h2>
          <div className={styles.panels}>
            {offers.map((c) => (
              <CouponCard key={c.code} c={c} onUse={toSearch} panel />
            ))}
          </div>
        </>
      )}

      {api.status === "ready" && mine.length === 0 && offers.length === 0 && (
        <Empty Icon={TicketPercent} title="No coupon codes right now" text="New offers and your referral bonuses will appear here.">
          <button type="button" className={`${styles.btn} ${styles.btnLine}`} onClick={() => go("referrals")}>
            <Gift size={16} strokeWidth={2} aria-hidden="true" />
            Refer a friend to earn one
          </button>
        </Empty>
      )}

      {(api.status === "ready" || api.status === "setup") && (
        <>
          <h2 className={styles.subhead}>Used coupons</h2>
          <div className={styles.panels}>
            {used.length ? (
              used.map((u) =>
                u.value !== null ? (
                  <CouponCard
                    panel
                    key={`${u.code}-${u.bookingCode}`}
                    c={{ ...u, text: [u.description && (/[.!?]$/.test(u.description) ? u.description : `${u.description}.`), `Code ${u.code}.`].filter(Boolean).join(" "), meta: u.date ? `Used ${day(u.date)}` : "Used" }}
                    used={{ bookingCode: u.bookingCode }}
                  />
                ) : (
                  <Card panel key={`${u.code}-${u.bookingCode}`} Icon={CircleCheck} tone="muted" muted title={u.code} meta={u.date ? `Used ${day(u.date)}` : "Used"}>
                    Used on {u.bookingCode}
                  </Card>
                )
              )
            ) : (
              <Card panel Icon={TicketPercent} tone="muted" muted title="Nothing used yet" meta="Applied at checkout">
                Coupons you use will show here with the booking they saved you money on.
              </Card>
            )}
          </div>
        </>
      )}
    </section>
  );
}
