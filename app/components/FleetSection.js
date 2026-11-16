"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, Fuel, Info, Settings2, Users, Zap } from "lucide-react";
import { FiTruck } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { useCity } from "../context/CityContext";
import { formatDuration, formatINR, perPerson, tripHours, tripPrice, tripWeekendHours, WEEKEND_SURGE } from "@/lib/tripPrice";
import { DEFAULT_CITY } from "@/lib/searchDefaults";
import ui from "./landing/ui.module.css";
import styles from "./FleetSection.module.css";

// One row of cars (CSS hides cards past the first row: 4, 3 or 2 per row by width; phones get a
// sideways-swipe row with every car). "Show all" opens the search page with the same search.
const SKELETONS = 4;

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "");

// The three things renters choose on: seats, gearbox, fuel
const specsOf = (car) =>
  [
    car.seats && { Icon: Users, label: `${car.seats} seats` },
    car.transmission && { Icon: Settings2, label: cap(car.transmission) },
    car.fuel && { Icon: /electric/i.test(car.fuel) ? Zap : Fuel, label: cap(car.fuel) },
  ].filter(Boolean);

export default function FleetSection() {
  const router = useRouter();
  const { selectedCity, pickupDateTime, returnDateTime, searchPlace } = useCity();
  const city = selectedCity || DEFAULT_CITY;

  const [vehicles, setVehicles] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [pending, setPending] = useState(null); // car tapped before dates were picked
  const [infoOpen, setInfoOpen] = useState(false); // "All-in prices" explainer (tap on phones)
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
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

  // The search bar fills in dates on load (saved search or tomorrow) and keeps the saved search in sync
  const hasDates = Boolean(pickupDateTime && returnDateTime);
  // Trip length once dates are picked; otherwise cards show a 1-day all-in price
  const hours = tripHours(pickupDateTime, returnDateTime);
  const weekendHours = tripWeekendHours(pickupDateTime, returnDateTime);

  const carHref = (car) => {
    const params = new URLSearchParams({ id: String(car.id), city });
    if (hasDates) {
      params.set("pickup", pickupDateTime);
      params.set("return", returnDateTime);
    }
    return `/car/${car.id}?${params}`;
  };

  // "Show all" → the search page for the search bar's city, dates and spot (same URL as its Search button)
  const searchHref = (() => {
    const params = new URLSearchParams({ city });
    if (hasDates) {
      params.set("pickupTime", pickupDateTime);
      params.set("returnTime", returnDateTime);
    }
    if (searchPlace) {
      params.set("lat", String(searchPlace.lat));
      params.set("lon", String(searchPlace.lon));
      params.set("address", searchPlace.address || "");
    }
    return `/search?${params}`;
  })();

  // Car pages need dates. Instead of an error, open the search bar's date picker
  // (SearchBar listens for "open-dates"); once dates are set we continue to the car.
  const askForDates = () => {
    const search = document.querySelector('[role="search"]');
    if (!search) {
      toast.error("Please pick your pickup and return dates first");
      return false;
    }
    search.scrollIntoView({ behavior: "smooth", block: "center" });
    window.dispatchEvent(new Event("open-dates"));
    return true;
  };

  const openCar = (car) => (e) => {
    if (hasDates) return;
    e.preventDefault();
    if (askForDates()) setPending(car);
  };

  // Closing the date picker without choosing cancels the pending car
  useEffect(() => {
    const cancel = () => setPending(null);
    window.addEventListener("dates-closed", cancel);
    return () => window.removeEventListener("dates-closed", cancel);
  }, []);

  useEffect(() => {
    if (!hasDates || !pending) return;
    router.push(carHref(pending));
    setPending(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasDates, pending]);

  return (
    <section className={styles.section} aria-labelledby="fleet-heading" data-mm>
      <div className={styles.inner}>
        <header className={ui.head}>
          <h2 id="fleet-heading" className={ui.title}>
            Our Fleet
          </h2>
          <p className={ui.lead}>Well-kept cars in {city}, zero deposit and doorstep delivery. Pick, book and drive.</p>
        </header>

        {status === "loading" && (
          <>
            <ul className={styles.grid} aria-busy="true" aria-label="Loading cars">
              {Array.from({ length: SKELETONS }, (_, i) => (
                <li key={i}>
                  <div className={`${styles.skelCard} ${styles.skeleton}`} />
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
            <div className={styles.toolbar}>
              <div className={styles.toolbarEnd}>

              {/* What the price includes (replaces the old note under the cars) */}
              <div className={styles.info}>
                <button
                  type="button"
                  className={styles.infoBtn}
                  aria-expanded={infoOpen}
                  aria-describedby="fleet-price-info"
                  onClick={() => setInfoOpen((o) => !o)}
                  onBlur={() => setInfoOpen(false)}
                >
                  <Info size={16} strokeWidth={2} aria-hidden="true" />
                  <span className={styles.infoLabel}>All-in prices</span>
                </button>
                <span id="fleet-price-info" role="tooltip" className={`${styles.tip} ${infoOpen ? styles.tipOpen : ""}`}>
                  {hours
                    ? `Total for your ${formatDuration(hours)} trip with GST, insurance and fees included${
                        weekendHours ? `, plus the weekend rate (+${Math.round(WEEKEND_SURGE * 100)}%) for ${weekendHours} hrs` : ""
                      }. Coupons apply at checkout.`
                    : `Price for 1 weekday with GST, insurance and fees included. Weekend days are ${Math.round(
                        WEEKEND_SURGE * 100
                      )}% more. Pick dates to see your trip total.`}
                </span>
              </div>

              {/* Dates: opens the search bar's picker; shows the trip length once picked */}
              <button
                type="button"
                className={`${styles.dates} ${hours ? styles.datesSet : ""}`}
                onClick={askForDates}
                aria-label={hours ? `Your trip: ${formatDuration(hours)}. Change dates` : "Pick your trip dates"}
              >
                <CalendarDays size={16} strokeWidth={2} aria-hidden="true" />
                <span className={styles.datesLabel}>{hours ? `${formatDuration(hours)} trip` : "Pick dates"}</span>
              </button>

              </div>
            </div>

            <ul className={styles.grid}>
              {vehicles.map((car) => {
                const total = tripPrice(car.pricePerDay, pickupDateTime, returnDateTime)?.total;
                const split = total && perPerson(total, car.seats);
                return (
                  <li key={car.id}>
                    <Link href={carHref(car)} className={styles.card} onClick={openCar(car)}>
                      <div className={styles.stage}>
                        <span className={styles.type}>{car.type}</span>
                        {car.trending && <span className={styles.badge}>Trending</span>}
                        {car.image ? (
                          <Image
                            src={car.image}
                            alt={car.name}
                            fill
                            sizes="(max-width: 760px) 40vw, (max-width: 1240px) 33vw, 25vw"
                            className={styles.image}
                          />
                        ) : (
                          <span className={styles.noImage} aria-hidden="true">
                            <FiTruck />
                          </span>
                        )}
                      </div>

                      <div className={styles.body}>
                        <h3 className={styles.name}>{car.name}</h3>
                        <ul className={styles.specs}>
                          {specsOf(car).map(({ Icon, label }) => (
                            <li key={label}>
                              <Icon size={15} strokeWidth={2} aria-hidden="true" />
                              {label}
                            </li>
                          ))}
                        </ul>
                        <div className={styles.foot}>
                          {total && (
                            <div>
                              <p className={styles.price}>
                                {formatINR(total)}
                                <span>{hours ? " total" : "/day"}</span>
                              </p>
                              <p className={styles.split}>
                                {formatINR(split.each)} each for {split.people}
                              </p>
                            </div>
                          )}
                          <span className={styles.cta}>Book</span>
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* data-count lets CSS hide the button when every car already fits in the row */}
            {vehicles.length > 2 && (
              <div className={styles.more} data-count={Math.min(vehicles.length, 5)}>
                <Link href={searchHref} className={styles.moreBtn}>
                  Show all {vehicles.length} cars
                </Link>
              </div>
            )}

          </>
        )}
      </div>
    </section>
  );
}
