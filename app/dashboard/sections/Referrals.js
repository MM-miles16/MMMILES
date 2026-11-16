"use client";
// Refer & earn, as cards in the Updates style: invite card (code, share, WhatsApp, copy link),
// progress, your ₹200 bonuses (also in My coupons), how it works, and your friends. When a friend
// completes their first trip you get a ₹200 bonus for your next booking; friends get the ₹350
// first-trip offer every new customer gets.
import { CarFront, Copy, Gift, Link2, Share2, Ticket, UserPlus, Users } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { Card, copyText, day, Head, LoadError, rupees, SkeletonRows, useApi } from "../shared";
import { CouponCard } from "./Coupons";
import { useSearchLink } from "./Trips";
import styles from "../dashboard.module.css";

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

export default function Referrals({ onBack, go }) {
  const api = useApi("/api/dashboard/referrals");
  const toSearch = useSearchLink();
  const d = api.data || {};
  const reward = rupees(d.reward || 200);
  const friendOffer = rupees(d.friendOffer || 350);
  const bonuses = d.bonuses || [];
  const ready = bonuses.filter((b) => !b.used);
  const stats = d.stats || {};
  const message = d.link ? `Rent a self-drive car with MM Miles. New customers get ${friendOffer} off their first trip. Sign up with my link: ${d.link}` : "";

  const howItWorks = (
    <>
      <h2 className={styles.subhead}>How it works</h2>
      <div className={styles.cards}>
        <Card Icon={Share2} title="1. Share your link" meta="Any app works">
          Send it to friends who haven&apos;t used MM Miles yet.
        </Card>
        <Card Icon={UserPlus} title={`2. They save ${friendOffer}`} meta="On their first trip">
          Your friend logs in with your link and gets {friendOffer} off their first trip.
        </Card>
        <Card Icon={Ticket} title={`3. You get ${reward}`} meta="After their trip ends">
          A {reward} bonus for your next booking appears here and in My coupons.
        </Card>
      </div>
    </>
  );

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "MM Miles", text: message });
        return;
      } catch {
        // cancelled: fall through to copying
      }
    }
    copyText(message, "Invite copied");
  };

  return (
    <section aria-labelledby="dash-title">
      <Head title="Refer & earn" lead={`Invite friends to MM Miles and get ${reward} off your next booking.`} onBack={onBack} />

      <div className={styles.cards}>
        <Card
          Icon={Gift}
          tone="dark"
          wide
          heading="h2"
          title={`Invite a friend, get ${reward}`}
          actions={
            api.status === "ready" ? (
              <div className={styles.refShare}>
                <span className={styles.fieldLabel}>Your invite code</span>
                <button type="button" className={styles.refCode} onClick={() => copyText(d.code, "Code copied")} aria-label={`Copy invite code ${d.code}`}>
                  <span>{d.code}</span>
                  <Copy size={17} strokeWidth={2} aria-hidden="true" />
                </button>
                <div className={styles.refButtons}>
                  <button type="button" className={`${styles.btn} ${styles.btnDark}`} onClick={share}>
                    <Share2 size={16} strokeWidth={2} aria-hidden="true" />
                    Share invite
                  </button>
                  <a className={`${styles.btn} ${styles.btnLine}`} href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer">
                    <FaWhatsapp size={17} aria-hidden="true" style={{ color: "#25d366" }} />
                    WhatsApp
                  </a>
                  <button type="button" className={`${styles.btn} ${styles.btnLine}`} onClick={() => copyText(d.link, "Link copied")}>
                    <Link2 size={16} strokeWidth={2} aria-hidden="true" />
                    Copy link
                  </button>
                </div>
              </div>
            ) : null
          }
        >
          Your friend gets {friendOffer} off their first trip, like every new customer. When they finish it, you get a {reward} bonus for your next booking.
        </Card>
      </div>

      {api.status === "loading" && <SkeletonRows count={2} height={90} />}
      {api.status === "error" && <LoadError onRetry={api.reload} />}
      {api.status === "setup" && howItWorks}

      {api.status === "ready" && (
        <>
          {d.invitedBy?.status === "joined" && (
            <div className={`${styles.banner} ${styles.bannerInfo} ${styles.bannerGap}`} role="status">
              <Gift size={20} strokeWidth={2} aria-hidden="true" />
              <span>You joined with a friend&apos;s invite. Your {friendOffer} first-trip offer is applied automatically at checkout.</span>
            </div>
          )}

          <h2 className={styles.subhead}>Your progress</h2>
          <div className={styles.cards}>
            <Card Icon={UserPlus} title={plural(stats.joined ?? 0, "friend joined", "friends joined")} meta="Counted at their first login">
              Friends who signed up with your link.
            </Card>
            <Card Icon={CarFront} title={plural(stats.completed ?? 0, "first trip done", "first trips done")} meta={`${rupees(stats.earned ?? 0)} earned so far`}>
              Each friend&apos;s first trip earns you {reward}.
            </Card>
            <Card Icon={Ticket} tone={ready.length ? "ok" : undefined} title={`${rupees(ready.length * (d.reward || 200))} ready to use`} meta="Also listed in My coupons" onClick={() => go("coupons")}>
              {ready.length ? "Use it on your next booking at checkout." : "Your bonuses appear here when friends finish their first trip."}
            </Card>
          </div>

          {bonuses.length > 0 && (
            <>
              <h2 className={styles.subhead}>Your referral bonuses</h2>
              <div className={styles.cards}>
                {bonuses.map((b) => (
                  <CouponCard
                    key={b.code}
                    c={{ code: b.code, type: "flat", value: b.value, personal: true, text: "Referral bonus for your next booking. Single use.", meta: b.earnedAt ? `Earned ${day(b.earnedAt)}` : "Referral bonus" }}
                    used={b.used ? b.usedOn || { bookingCode: "a booking" } : null}
                    onUse={toSearch}
                  />
                ))}
              </div>
            </>
          )}

          {howItWorks}

          <h2 className={styles.subhead}>Your friends</h2>
          {d.friends?.length ? (
            <div className={styles.cards}>
              {d.friends.map((f, i) => (
                <Card
                  key={i}
                  Icon={Users}
                  tone={f.status === "rewarded" ? "ok" : undefined}
                  title={f.name}
                  badge={<span className={`${styles.chip} ${f.status === "rewarded" ? styles.chipPaid : styles.chipPending}`}>{f.status === "rewarded" ? `${reward} earned` : "Pending"}</span>}
                  meta={f.status === "rewarded" ? `First trip done ${day(f.rewardedAt)}` : `Joined ${day(f.joinedAt)}`}
                >
                  {f.status === "rewarded" ? "Finished their first trip. Your bonus is ready." : "Joined with your link. Waiting for their first trip."}
                </Card>
              ))}
            </div>
          ) : (
            <p className={styles.lead}>No friends have joined yet. Share your link to get started.</p>
          )}

          <p className={styles.fine}>
            Each bonus is a single-use coupon for one future booking, and it works alongside the free hour you get on every trip after your first. A friend counts once, on their first login through your link, and the bonus is added after their first trip ends.
          </p>
        </>
      )}
    </section>
  );
}
