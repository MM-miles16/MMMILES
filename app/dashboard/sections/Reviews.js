"use client";
// Car reviews: completed trips waiting for a rating (tap a star to start), and your reviews (edit
// any time). The review sheet has big stars with a word for each rating and an optional comment.
// After saving, everyone (whatever their rating) is invited to post the same review on Google:
// the text is copied and MM Miles's Google review page opens. Google only accepts reviews written
// from the customer's own Google account, so the site can't post it for them.
import { useState } from "react";
import Image from "next/image";
import { ArrowUpRight, CarFront, CircleCheck, Pencil, Star } from "lucide-react";
import { toast } from "react-hot-toast";
import { Card, copyNow, day, Empty, GOOGLE_REVIEW_URL, Head, LoadError, send, Sheet, SkeletonRows, stamp, useApi } from "../shared";
import styles from "../dashboard.module.css";

const WORDS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

function Stars({ value, size = 18, label }) {
  return (
    <span className={styles.stars} role="img" aria-label={label || `${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={size} strokeWidth={1.8} className={n <= value ? styles.starOn : styles.starOff} aria-hidden="true" />
      ))}
    </span>
  );
}

// Opens MM Miles's Google review page in a new tab; copies the review first so it can be pasted
function GoogleReviewLink({ text, className, children, logo = 18, mark = true }) {
  return (
    <a
      href={GOOGLE_REVIEW_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={() => {
        if (text && copyNow(text)) toast.success("Review copied. Paste it on Google.", { duration: 5000 });
      }}
    >
      {mark && (
        <span className={styles.gMark} aria-hidden="true">
          <Image src="/google-icon.png" alt="" width={logo} height={logo} />
        </span>
      )}
      {children}
      <span className={styles.srOnly}> (opens Google in a new tab)</span>
    </a>
  );
}

// "Tell others on Google": one panel with the Google mark, a star row that fills as you point at
// it (every star opens the same Google page, so nobody is steered by rating) and a clear CTA.
function GoogleCard() {
  return (
    <section className={styles.gReview} aria-labelledby="g-review-title">
      <span className={styles.gReviewLogo} aria-hidden="true">
        <Image src="/google-icon.png" alt="" width={34} height={34} />
      </span>
      <div className={styles.gReviewText}>
        <h2 id="g-review-title" className={styles.gReviewTitle}>
          Loved your trip? Tell others on Google
        </h2>
        <p className={styles.gReviewLead}>A few honest words help other travellers find a car they can trust, and help us keep getting better.</p>
        <GoogleReviewLink className={styles.gStars} mark={false}>
          <span className={styles.gStarRow} aria-hidden="true">
            {[5, 4, 3, 2, 1].map((n) => (
              <Star key={n} size={26} strokeWidth={1.7} />
            ))}
          </span>
          <span className={styles.gStarsText}>Tap a star to start your review</span>
        </GoogleReviewLink>
      </div>
      <GoogleReviewLink className={`${styles.btn} ${styles.btnDark} ${styles.gReviewCta}`} mark={false}>
        Write a review
        <ArrowUpRight size={17} strokeWidth={2.2} aria-hidden="true" />
      </GoogleReviewLink>
    </section>
  );
}

export default function Reviews({ onBack }) {
  const api = useApi("/api/dashboard/reviews");
  const [editing, setEditing] = useState(null); // { trip, rating, comment }
  const [done, setDone] = useState(null); // the review just saved: { trip, rating, comment }
  const [saving, setSaving] = useState(false);
  const pending = api.data?.pending || [];
  const reviews = api.data?.reviews || [];

  const close = () => {
    setEditing(null);
    setDone(null);
  };

  const save = async (e) => {
    e.preventDefault();
    if (!editing.rating) return toast.error("Please choose a star rating.");
    setSaving(true);
    try {
      const comment = editing.comment.trim();
      await send("/api/dashboard/reviews", "POST", { bookingId: editing.trip.bookingId, rating: editing.rating, comment });
      setDone({ ...editing, comment });
      setEditing(null);
      api.reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section aria-labelledby="dash-title">
      <Head title="Car reviews" lead="Rate the cars you've driven. Your review helps other renters choose." onBack={onBack} />

      {api.status === "loading" && <SkeletonRows count={2} height={110} />}
      {api.status === "error" && <LoadError onRetry={api.reload} />}

      {api.status === "ready" && pending.length === 0 && reviews.length === 0 && (
        <Empty Icon={Star} title="Nothing to review yet" text="After your trip ends, you can rate the car here." />
      )}

      {api.status === "ready" && pending.length > 0 && (
        <>
          <h2 className={`${styles.subhead} ${styles.subheadFirst}`}>Waiting for your review</h2>
          <div className={styles.cards}>
            {pending.map((t) => {
              const s = stamp(t.startTime);
              return (
                <Card
                  key={t.bookingId}
                  Icon={CarFront}
                  title={t.title}
                  meta={`${t.bookingCode}${s ? `, ${s.date} ${s.year}` : ""}`}
                  actions={
                    <div className={styles.rateRow} role="group" aria-label={`Rate ${t.title}`}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button key={n} type="button" className={styles.rateStar} onClick={() => setEditing({ trip: t, rating: n, comment: "" })} aria-label={`${n} star${n > 1 ? "s" : ""}`}>
                          <Star size={24} strokeWidth={1.8} aria-hidden="true" />
                        </button>
                      ))}
                    </div>
                  }
                >
                  How was your trip? Tap a star to rate the car.
                </Card>
              );
            })}
          </div>
        </>
      )}

      {api.status === "ready" && reviews.length > 0 && (
        <>
          <h2 className={`${styles.subhead} ${pending.length ? "" : styles.subheadFirst}`}>Your reviews</h2>
          <div className={styles.cards}>
            {reviews.map((r) => (
              <Card
                key={r.id}
                Icon={Star}
                title={r.title}
                meta={`Reviewed on ${day(r.updatedAt || r.createdAt)}`}
                actions={
                  <>
                    <button type="button" className={`${styles.btnSm} ${styles.btnLine}`} onClick={() => setEditing({ trip: r, rating: r.rating, comment: r.comment || "" })}>
                      <Pencil size={14} strokeWidth={2} aria-hidden="true" />
                      Edit
                    </button>
                    <GoogleReviewLink text={r.comment} className={`${styles.btnSm} ${styles.btnLine}`} logo={15}>
                      Post on Google
                    </GoogleReviewLink>
                  </>
                }
              >
                <Stars value={r.rating} size={16} />
                {r.comment ? <span className={styles.cardQuote}>{r.comment}</span> : <span className={styles.cardQuote}>No comment added.</span>}
              </Card>
            ))}
          </div>
        </>
      )}

      {(api.status === "ready" || api.status === "setup") && <GoogleCard />}

      <Sheet
        open={Boolean(editing || done)}
        onClose={close}
        title={done ? "Thanks for your review" : editing?.trip?.title ? `Rate the ${editing.trip.title}` : "Rate your trip"}
        lead={done ? null : "Your rating helps other renters choose."}
        onSubmit={done ? undefined : save}
        footer={
          done ? (
            <>
              <button type="button" className={`${styles.btn} ${styles.btnLine}`} onClick={close}>
                Maybe later
              </button>
              <GoogleReviewLink text={done.comment} className={`${styles.btn} ${styles.btnDark}`} logo={16}>
                Post on Google
              </GoogleReviewLink>
            </>
          ) : (
            <>
              <button type="button" className={`${styles.btn} ${styles.btnLine}`} onClick={close}>
                Cancel
              </button>
              <button type="submit" className={`${styles.btn} ${styles.btnDark}`} disabled={saving} aria-busy={saving}>
                {saving ? (
                  <>
                    <span className={styles.btnSpinner} aria-hidden="true" />
                    Saving
                  </>
                ) : (
                  "Submit review"
                )}
              </button>
            </>
          )
        }
      >
        {done && (
          <div className={styles.thanks}>
            <span className={styles.thanksIcon} aria-hidden="true">
              <CircleCheck size={30} strokeWidth={2} />
            </span>
            <Stars value={done.rating} size={22} />
            <p className={styles.thanksText}>
              Your review of the {done.trip.title} is saved. Would you share it on Google too? It takes a few seconds and helps other travellers find MM Miles.
            </p>
            {done.comment ? (
              <figure className={styles.gQuote}>
                <blockquote>{done.comment}</blockquote>
                <figcaption>We&apos;ll copy this for you. On Google, choose your stars and paste it in.</figcaption>
              </figure>
            ) : (
              <p className={styles.fieldHint}>Google opens in a new tab. Choose your stars and add a line about your trip.</p>
            )}
          </div>
        )}
        {editing && (
          <>
            <div className={styles.bigStars} role="radiogroup" aria-label="Your rating">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={editing.rating === n}
                  aria-label={`${n} star${n > 1 ? "s" : ""}, ${WORDS[n]}`}
                  className={`${styles.bigStar} ${n <= editing.rating ? styles.bigStarOn : ""}`}
                  onClick={() => setEditing((x) => ({ ...x, rating: n }))}
                  data-autofocus={n === 1 ? "" : undefined}
                >
                  <Star size={34} strokeWidth={1.6} aria-hidden="true" />
                </button>
              ))}
            </div>
            <p className={styles.ratingWord} aria-live="polite">
              {editing.rating ? WORDS[editing.rating] : "Tap a star to rate"}
            </p>
            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor="rv-comment">
                Tell others about the car (optional)
              </label>
              <textarea
                id="rv-comment"
                className={styles.input}
                rows={4}
                maxLength={1000}
                value={editing.comment}
                onChange={(e) => setEditing((x) => ({ ...x, comment: e.target.value }))}
                placeholder="How was the car, the pickup and the drive?"
              />
              <span className={styles.fieldHint}>{editing.comment.length}/1000</span>
            </div>
          </>
        )}
      </Sheet>
    </section>
  );
}
