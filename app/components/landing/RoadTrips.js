import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock, MapPin } from "lucide-react";
import { getRoadTrips } from "@/lib/landing";
import ui from "./ui.module.css";
import styles from "./RoadTrips.module.css";

export default function RoadTrips() {
  const trips = getRoadTrips("chennai");
  if (trips.length === 0) return null;

  return (
    <section className={ui.section} aria-labelledby="trips-title">
      <div className={ui.container}>
        <div className={ui.headRow}>
          <div className={ui.head}>
            <p className={ui.eyebrow}>Road trips from Chennai</p>
            <h2 id="trips-title" className={ui.title}>
              Where will you drive this weekend?
            </h2>
          </div>
          <Link href="/blog" className={ui.textLink}>
            Travel guides <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      <ul className={styles.track}>
        {trips.map((t) => {
          const card = (
            <>
              <Image src={t.image} alt={`${t.name}, a road trip from Chennai`} fill sizes="(max-width: 760px) 70vw, 300px" className={styles.photo} />
              <div className={styles.overlay}>
                <h3 className={styles.name}>{t.name}</h3>
                <div className={styles.meta}>
                  <span>
                    <MapPin size={14} aria-hidden="true" /> {t.distance}
                  </span>
                  <span>
                    <Clock size={14} aria-hidden="true" /> {t.time}
                  </span>
                </div>
                {t.href && <span className={styles.guide}>Read the guide →</span>}
              </div>
            </>
          );
          return (
            <li key={t.name} className={styles.item}>
              {t.href ? (
                <Link href={t.href} className={styles.card}>
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
