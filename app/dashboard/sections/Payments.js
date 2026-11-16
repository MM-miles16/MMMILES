"use client";
// Payments, in the "review card" panel look: a summary panel (total, payments, coupons used), then
// one panel per payment with the car, booking code, date, status, coupon used, the Razorpay payment
// ID (copyable) and the amount on the right.
import { useMemo } from "react";
import { Copy, CreditCard, ShieldCheck, TicketPercent, Wallet } from "lucide-react";
import { Card, copyText, day, Empty, Head, rupees, SkeletonRows } from "../shared";
import styles from "../dashboard.module.css";

const shortId = (id) => (id && id.length > 14 ? `${id.slice(0, 4)}…${id.slice(-6)}` : id);

function statusOf(t) {
  if (t.status === "cancelled") return { label: "Cancelled", cls: "chipCancelled" };
  if (t.paymentId) return { label: "Paid", cls: "chipPaid" };
  return { label: "Not paid", cls: "chipCompleted" };
}

export default function Payments({ trips, onBack }) {
  const rows = useMemo(
    () =>
      trips.list
        .filter((t) => t.amount > 0 || t.paymentId)
        .sort((a, b) => new Date(b.createdAt || b.startTime) - new Date(a.createdAt || a.startTime)),
    [trips.list]
  );
  const paid = rows.filter((t) => t.paymentId && t.status !== "cancelled");
  const total = paid.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const couponsUsed = rows.filter((t) => t.appliedCoupon).length;

  return (
    <section aria-labelledby="dash-title">
      <Head title="Payments" lead="Every payment for your trips, in one place." onBack={onBack} />

      {trips.status === "loading" && <SkeletonRows count={3} />}

      {trips.status === "ready" && rows.length === 0 && <Empty Icon={CreditCard} title="No payments yet" text="Payments for your trips will appear here." />}

      {trips.status === "ready" && rows.length > 0 && (
        <>
          <div className={styles.panels}>
            <Card
              panel
              Icon={Wallet}
              title={`${rupees(total)} paid in total`}
              meta="Processed securely by Razorpay"
              actions={
                <div className={styles.panelStats}>
                  <span>
                    <b data-mm-keep>{paid.length}</b>
                    {paid.length === 1 ? "payment" : "payments"}
                  </span>
                  <span>
                    <b data-mm-keep>{couponsUsed}</b>
                    {couponsUsed === 1 ? "coupon used" : "coupons used"}
                  </span>
                </div>
              }
            >
              Every trip you&apos;ve paid for, newest first.
            </Card>
          </div>

          <h2 className={styles.subhead}>Your payments</h2>
          <div className={styles.panels}>
            {rows.map((t) => {
              const s = statusOf(t);
              return (
                <Card
                  key={t.id}
                  panel
                  Icon={CreditCard}
                  tone={s.label === "Paid" ? undefined : "muted"}
                  muted={s.label === "Cancelled"}
                  title={t.title}
                  badge={<span className={`${styles.chip} ${styles[s.cls]}`}>{s.label}</span>}
                  actions={<strong className={styles.panelAmount}>{rupees(t.amount)}</strong>}
                >
                  <span>
                    {t.bookingCode}
                    {t.createdAt ? ` on ${day(t.createdAt)}` : ""}
                  </span>
                  {(t.paymentId || t.appliedCoupon) && (
                    <span className={styles.payLine}>
                      {t.paymentId && (
                        <button type="button" className={styles.payId} onClick={() => copyText(t.paymentId, "Payment ID copied")} title="Copy payment ID" aria-label={`Copy payment ID ${t.paymentId}`}>
                          {shortId(t.paymentId)}
                          <Copy size={13} strokeWidth={2} aria-hidden="true" />
                        </button>
                      )}
                      {t.appliedCoupon && (
                        <span className={styles.payCoupon}>
                          <TicketPercent size={13} strokeWidth={2} aria-hidden="true" />
                          {t.appliedCoupon}
                        </span>
                      )}
                    </span>
                  )}
                </Card>
              );
            })}
          </div>

          <p className={styles.promise}>
            <ShieldCheck size={15} strokeWidth={2} aria-hidden="true" />
            Payments are processed securely by Razorpay. Share the payment ID with support for any question.
          </p>
        </>
      )}
    </section>
  );
}
