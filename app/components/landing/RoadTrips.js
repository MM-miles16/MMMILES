import Image from "next/image";
import Link from "next/link";
import { Clock, MapPin } from "lucide-react";
import { getRoadTrips } from "@/lib/landing";
import ui from "./ui.module.css";
import styles from "./RoadTrips.module.css";

// "Roads worth taking" — six portrait photos in a staggered row (laptops and up); a swipeable
// app-style row on phones and tablets. Distance and drive time slide up on hover (always shown
// on phones). Cards with a travel guide link to it.
export default function RoadTrips() {
  const trips = getRoadTrips("chennai");
  if (trips.length === 0) return null;

  return (
    <section className={`${ui.section} ${styles.section}`} aria-labelledby="trips-title">
      <div className={ui.container}>
        <div className={`${ui.head} ${styles.head}`}>
          <h2 id="trips-title" className={ui.title}>
            Roads worth taking
          </h2>
          <p className={ui.lead}>From the coast road to the hill stations, a self-drive car turns a free weekend into a trip to remember.</p>
        </div>
      </div>

      <ul className={styles.track}>
        {trips.map((t) => {
          const name = t.label ?? t.name;
          const card = (
            <>
              <Image src={t.image} alt={`${t.name}, a road trip from Chennai`} fill sizes="(max-width: 899px) 44vw, 220px" className={styles.photo} />
              <span className={styles.overlay}>
                <span className={styles.name}>{name}</span>
                <span className={styles.meta}>
                  <span>
                    <MapPin size={13} aria-hidden="true" /> {t.distance}
                  </span>
                  <span>
                    <Clock size={13} aria-hidden="true" /> {t.time}
                  </span>
                </span>
              </span>
            </>
          );
          return (
            <li key={t.name} className={styles.item}>
              {t.href ? (
                <Link href={t.href} className={styles.card} aria-label={`${name}: read the road trip guide`}>
                  {card}
                </Link>
              ) : (
                <div className={styles.card}>{card}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
