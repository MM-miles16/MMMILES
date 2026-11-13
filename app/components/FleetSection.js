"use client";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FiArrowUpRight, FiTruck } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { useCity } from "../context/CityContext";
import { formatDuration, formatINR, perPerson, tripHours, tripPrice, tripWeekendHours, WEEKEND_SURGE } from "@/lib/tripPrice";
import ui from "./landing/ui.module.css";
import styles from "./FleetSection.module.css";

const DEFAULT_CITY = "Chennai";
const MAX_CARDS = 7; // 3 large + 4 small, like the reference layout

// Filter pills — only pills that match at least one car in the city are shown
const FILTERS = [
  { key: "all", label: "All cars", match: () => true },
  { key: "suv", label: "SUV", match: (c) => /suv/i.test(c.type) },
  { key: "hatchback", label: "Hatchback", match: (c) => /hatch/i.test(c.type) },
  { key: "sedan", label: "Sedan", match: (c) => /sedan/i.test(c.type) },
  { key: "seven", label: "7+ Seater", match: (c) => c.seats >= 7 },
  { key: "automatic", label: "Automatic", match: (c) => /auto/i.test(c.transmission || "") },
  { key: "electric", label: "Electric", match: (c) => /electric/i.test(c.fuel || "") },
];

export default function FleetSection() {
  const { selectedCity, pickupDateTime, returnDateTime } = useCity();
  const city = selectedCity || DEFAULT_CITY;

  const [vehicles, setVehicles] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [filter, setFilter] = useState("all");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setFilter("all");
    fetch(`/api/vehicles/fleet?city=${encodeURIComponent(city)}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        setVehicles(data.vehicles || []);
        setStatus("ready");
      })
      .catch((err) => {
        console.error("Error fetching fleet:", err);
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [city, reloadKey]);

  const pills = useMemo(
    () =>
      FILTERS.map((f) => ({ ...f, count: vehicles.filter(f.match).length })).filter(
        (f) => f.key === "all" || f.count > 0
      ),
    [vehicles]
  );
  const active = FILTERS.find((f) => f.key === filter) || FILTERS[0];
  const shown = vehicles.filter(active.match).slice(0, MAX_CARDS);

  const hasDates = Boolean(pickupDateTime && returnDateTime);
  const searchParams = new URLSearchParams({ city, pickupTime: pickupDateTime || "", returnTime: returnDateTime || "" });
  // Trip length once dates are picked; otherwise cards show a 1-day all-in price
  const hours = tripHours(pickupDateTime, returnDateTime);
  const weekendHours = tripWeekendHours(pickupDateTime, returnDateTime);

  // Car pages need dates — same rule as the old trending section
  const requireDates = (e) => {
    if (hasDates) {
      sessionStorage.setItem("lastSearchParams", searchParams.toString());
      return;
    }
    e.preventDefault();
    toast.error("Please select pickup and return date & time in the search bar above");
    document.querySelector('[role="search"]')?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const carHref = (car) => {
    const params = new URLSearchParams({ id: String(car.id) });
    if (hasDates) {
      params.set("pickup", pickupDateTime);
      params.set("return", returnDateTime);
    }
    return `/car/${car.id}?${params}`;
  };

  return (
    <section className={styles.section} aria-labelledby="fleet-heading">
      <div className={styles.inner}>
        <header className={ui.head}>
          <p className={ui.eyebrow}>Self-drive cars in {city}</p>
          <h2 id="fleet-heading" className={ui.title}>
            Our Fleet
          </h2>
          <p className={ui.lead}>
            Well-kept cars with zero deposit and doorstep delivery. Pick a car, choose your dates and drive.
          </p>
        </header>

        {status === "loading" && (
          <>
            <div className={styles.pills} aria-hidden="true">
              {[96, 72, 104, 84].map((w, i) => (
                <span key={i} className={`${styles.pill} ${styles.skeleton}`} style={{ width: w }} />
              ))}
            </div>
            <ul className={styles.grid} aria-busy="true" aria-label="Loading cars">
              {Array.from({ length: MAX_CARDS }, (_, i) => (
                <li key={i} className={`${styles.item} ${i < 3 ? styles.itemLarge : styles.itemSmall}`}>
                  <div className={`${styles.card} ${styles.skeleton}`} />
                </li>
              ))}
            </ul>
          </>
        )}

        {status === "error" && (
          <div className={styles.state}>
            <p>We couldn&apos;t load cars right now.</p>
            <button type="button" className={styles.retry} onClick={() => setReloadKey((k) => k + 1)}>
              Try again
            </button>
          </div>
        )}

        {status === "ready" && vehicles.length === 0 && (
          <div className={styles.state}>
            <p>No cars are listed in {city} yet. Please check back soon.</p>
          </div>
        )}

        {status === "ready" && vehicles.length > 0 && (
          <>
            <div className={styles.pills} role="group" aria-label="Filter cars by type">
              {pills.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  aria-pressed={filter === p.key}
                  className={`${styles.pill} ${filter === p.key ? styles.pillActive : ""}`}
                  onClick={() => setFilter(p.key)}
                >
                  {p.label}
                  <span className={styles.pillCount}>{p.count}</span>
                </button>
              ))}
            </div>

            <ul className={styles.grid}>
              {shown.map((car, i) => {
                const total = tripPrice(car.pricePerDay, pickupDateTime, returnDateTime)?.total;
                const split = total && perPerson(total, car.seats);
                return (
                <li key={car.id} className={`${styles.item} ${i < 3 ? styles.itemLarge : styles.itemSmall}`}>
                  <Link href={carHref(car)} className={styles.card} onClick={requireDates}>
                    <div className={styles.tags}>
                      <span className={styles.tag}>{car.type}</span>
                      {car.trending && <span className={`${styles.tag} ${styles.tagDark}`}>Trending</span>}
                    </div>
                    <div className={styles.media}>
                      {car.image ? (
                        <Image
                          src={car.image}
                          alt={car.name}
                          fill
                          sizes="(max-width: 1080px) 50vw, 420px"
                          className={styles.image}
                        />
                      ) : (
                        <span className={styles.noImage} aria-hidden="true">
                          <FiTruck />
                        </span>
                      )}
                    </div>
                    <div className={styles.meta}>
                      <div>
                        <h3 className={styles.name}>{car.name}</h3>
                        {total && (
                          <>
                            <p className={styles.price}>
                              {formatINR(total)}
                              <span>{hours ? " total" : "/day"}</span>
                            </p>
                            <p className={styles.split}>
                              {formatINR(split.each)} each for {split.people}
                            </p>
                          </>
                        )}
                      </div>
                      <span className={styles.go} aria-hidden="true">
                        <FiArrowUpRight />
                      </span>
                    </div>
                  </Link>
                </li>
                );
              })}
            </ul>

            <p className={styles.note} aria-live="polite">
              {hours
                ? `All-in price for your ${formatDuration(hours)} trip: GST, insurance and fees included${
                    weekendHours ? `, with the weekend rate (+${Math.round(WEEKEND_SURGE * 100)}%) for ${weekendHours} hrs` : ""
                  }. Coupons apply at checkout.`
                : "All-in weekday price for a 1-day trip: GST, insurance and fees included. Pick your dates to see your trip total."}
            </p>
          </>
        )}
      </div>
    </section>
  );
}
