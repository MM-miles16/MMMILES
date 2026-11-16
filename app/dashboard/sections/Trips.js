"use client";
// My trips: filters with counts, and a card per trip (photo, status, pickup → return timeline,
// total, pickup spot, number plate + call host for upcoming, rate / book again for completed).
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Clock3, MapPin, Phone, RotateCcw, Star, Ticket, Users } from "lucide-react";
import { searchPageUrl } from "@/lib/searchDefaults";
import { formatDuration } from "@/lib/tripPrice";
import { amount, Empty, Head, stamp } from "../shared";
import styles from "../dashboard.module.css";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "upcoming", label: "Upcoming" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

const STATUS = {
  upcoming: { label: "Upcoming", cls: "chipUpcoming" },
  completed: { label: "Completed", cls: "chipCompleted" },
  cancelled: { label: "Cancelled", cls: "chipCancelled" },
};

export function useSearchLink() {
  const router = useRouter();
  return (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    router.push(searchPageUrl());
  };
}

export default function Trips({ trips, counts, filter, setFilter, reload, onBack, onRate }) {
  const toSearch = useSearchLink();

  // Upcoming first (soonest first), then past trips (latest first), then cancelled
  const list = useMemo(() => {
    const rank = { upcoming: 0, completed: 1, cancelled: 2 };
    const at = (t) => new Date(t.startTime).getTime() || 0;
    return trips.list
      .filter((t) => filter === "all" || t.status === filter)
      .sort((a, b) => (rank[a.status] ?? 3) - (rank[b.status] ?? 3) || (a.status === "upcoming" ? at(a) - at(b) : at(b) - at(a)));
  }, [trips.list, filter]);

  const filters = FILTERS.filter((f) => f.key !== "cancelled" || counts.cancelled > 0);

  return (
    <section aria-labelledby="dash-title">
      <Head
        title="My trips"
        lead="Your bookings, upcoming and past."
        onBack={onBack}
        action={
          <a href="/search" className={`${styles.btn} ${styles.btnDark}`} onClick={toSearch}>
            Book a car
          </a>
        }
      />

      <div className={styles.segment} role="tablist" aria-label="Filter trips">
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            role="tab"
            aria-selected={filter === f.key}
            className={`${styles.segBtn} ${filter === f.key ? styles.segActive : ""}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
            {trips.status === "ready" && <span className={styles.segCount}>{counts[f.key]}</span>}
          </button>
        ))}
      </div>

      {trips.status === "loading" && (
        <div className={styles.trips} aria-busy="true" aria-label="Loading trips">
          {[0, 1].map((i) => (
            <div key={i} className={`${styles.trip} ${styles.tripSkeleton}`}>
              <span className={`${styles.tripMedia} ${styles.shimmer}`} />
              <span className={styles.skelBody}>
                <span className={`${styles.skelLine} ${styles.shimmer}`} style={{ width: "46%" }} />
                <span className={`${styles.skelLine} ${styles.shimmer}`} style={{ width: "70%" }} />
                <span className={`${styles.skelLine} ${styles.shimmer}`} style={{ width: "58%" }} />
              </span>
            </div>
          ))}
        </div>
      )}

      {trips.status === "error" && (
        <Empty Icon={RotateCcw} title="We couldn't load your trips" text="Please check your connection and try again.">
          <button type="button" className={`${styles.btn} ${styles.btnDark}`} onClick={reload}>
            Try again
          </button>
        </Empty>
      )}

      {trips.status === "ready" && list.length === 0 && (
        <Empty
          Icon={Ticket}
          title={filter === "all" ? "No trips yet" : `No ${filter} trips`}
          text={filter === "all" ? "Your bookings will show up here once you reserve a car." : "Trips will show up here when you have some."}
        >
          <a href="/search" className={`${styles.btn} ${styles.btnDark}`} onClick={toSearch}>
            Find a car
          </a>
        </Empty>
      )}

      {trips.status === "ready" && list.length > 0 && (
        <div className={styles.trips}>
          {list.map((t) => (
            <TripCard key={t.id} trip={t} onRate={onRate} />
          ))}
        </div>
      )}
    </section>
  );
}

function TripCard({ trip: t, onRate }) {
  const [showPhone, setShowPhone] = useState(false);
  const start = stamp(t.startTime);
  const end = stamp(t.endTime);
  const hours = Number(t.hours) || (t.startTime && t.endTime ? Math.round((new Date(t.endTime) - new Date(t.startTime)) / 36e5) : 0);
  const status = STATUS[t.status] || STATUS.upcoming;
  const upcoming = t.status === "upcoming";
  const plate = upcoming && t.registrationNumber && t.registrationNumber !== "N/A" ? t.registrationNumber : null;

  const callHost = () => {
    if (/Mobi|Android/i.test(navigator.userAgent)) window.location.href = `tel:${t.hostPhone}`;
    else setShowPhone(true);
  };

  return (
    <article className={`${styles.trip} ${t.status === "cancelled" ? styles.tripCancelled : ""}`}>
      <div className={styles.tripMedia}>{t.img ? <Image src={t.img} alt={t.title} fill sizes="(max-width: 760px) 90vw, 260px" className={styles.tripImage} /> : null}</div>

      <div className={styles.tripBody}>
        <div className={styles.tripHead}>
          <div className={styles.tripName}>
            <h2 className={styles.tripTitle}>{t.title}</h2>
            <ul className={styles.specs}>
              <li>
                <Ticket size={14} strokeWidth={2} aria-hidden="true" />
                {t.bookingCode}
              </li>
              {t.seats ? (
                <li>
                  <Users size={14} strokeWidth={2} aria-hidden="true" />
                  {t.seats} seats
                </li>
              ) : null}
              {t.modelYear && t.modelYear !== "N/A" ? (
                <li>
                  <CalendarDays size={14} strokeWidth={2} aria-hidden="true" />
                  {t.modelYear} model
                </li>
              ) : null}
            </ul>
          </div>
          <span className={`${styles.chip} ${styles[status.cls]}`}>{status.label}</span>
        </div>

        <div className={styles.timeline}>
          <div className={styles.stop}>
            <span className={styles.stopLabel}>Pickup</span>
            <span className={styles.stopDate}>{start ? start.date : "N/A"}</span>
            <span className={styles.stopTime}>{start ? start.time : ""}</span>
          </div>
          <div className={styles.track}>
            {hours > 0 && (
              <span className={styles.duration}>
                <Clock3 size={13} strokeWidth={2} aria-hidden="true" />
                {formatDuration(hours)}
              </span>
            )}
          </div>
          <div className={`${styles.stop} ${styles.stopEnd}`}>
            <span className={styles.stopLabel}>Return</span>
            <span className={styles.stopDate}>{end ? end.date : "N/A"}</span>
            <span className={styles.stopTime}>{end ? end.time : ""}</span>
          </div>
        </div>

        <div className={styles.tripFoot}>
          <div className={styles.total}>
            <span>Total</span>
            <strong>{amount(t.price)}</strong>
          </div>
          <div className={styles.where}>
            <MapPin size={16} strokeWidth={2} aria-hidden="true" />
            <span>
              <span className={styles.whereText}>{t.hostAddress}</span>
              {t.hostName && <span className={styles.host}>Hosted by {t.hostName}</span>}
            </span>
          </div>
          <div className={styles.actions}>
            {plate && (
              <span className={styles.plate} aria-label={`Car number ${plate}`}>
                <span className={styles.plateBand} aria-hidden="true">
                  <span className={styles.holo} />
                  IND
                </span>
                <span className={styles.plateText}>{plate}</span>
              </span>
            )}
            {upcoming && t.hostPhone && !showPhone && (
              <button type="button" className={`${styles.btnSm} ${styles.btnLine}`} onClick={callHost}>
                <Phone size={15} strokeWidth={2} aria-hidden="true" />
                Call host
              </button>
            )}
            {upcoming && t.hostPhone && showPhone && (
              <a href={`tel:${t.hostPhone}`} className={`${styles.btnSm} ${styles.btnLine}`}>
                <Phone size={15} strokeWidth={2} aria-hidden="true" />
                {t.hostPhone}
              </a>
            )}
            {t.status === "completed" && (
              <button type="button" className={`${styles.btnSm} ${styles.btnLine}`} onClick={onRate}>
                <Star size={15} strokeWidth={2} aria-hidden="true" />
                Rate trip
              </button>
            )}
            {t.status === "completed" && t.vehicleId && (
              <Link href={`/car/${t.vehicleId}`} className={`${styles.btnSm} ${styles.btnLine}`}>
                <RotateCcw size={15} strokeWidth={2} aria-hidden="true" />
                Book again
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
