import Link from "next/link";
import { carTypes } from "@/lib/cars";
import { getAreas } from "@/lib/landing";
import ui from "./ui.module.css";
import styles from "./ExploreLinks.module.css";

const AREAS_SHOWN = 14;

// Visible internal links (replaces the old hidden SEO link lists).
// Types and models come from the live fleet so every link leads to cars people can book.
export default function ExploreLinks({ summary }) {
  const types = summary?.types ?? carTypes;
  const models = summary?.models ?? [];
  const areas = getAreas("chennai");

  return (
    <section className={`${ui.section} ${styles.section}`} aria-labelledby="explore-title">
      <div className={ui.container}>
        <div className={styles.panel}>
          <h2 id="explore-title" className={styles.title}>
            Explore self-drive rentals in Chennai
          </h2>

          <div className={styles.group}>
            <h3 className={styles.groupTitle}>By car type</h3>
            <ul className={styles.chips}>
              {types.map((t) => (
                <li key={t.slug}>
                  <Link href={`/cities/chennai/${t.slug}`}>{t.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {models.length > 0 && (
            <div className={styles.group}>
              <h3 className={styles.groupTitle}>Cars you can book</h3>
              <ul className={styles.chips}>
                {models.map((m) => (
                  <li key={m.slug}>
                    <Link href={`/rent/${m.slug}/chennai`}>{m.name} rental</Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className={styles.group}>
            <h3 className={styles.groupTitle}>Areas we deliver to</h3>
            <ul className={styles.chips}>
              {areas.slice(0, AREAS_SHOWN).map((a) => (
                <li key={a.slug}>
                  <Link href={`/cities/chennai/${a.slug}`}>{a.name}</Link>
                </li>
              ))}
            </ul>
            {areas.length > AREAS_SHOWN && (
              <details className={styles.more}>
                <summary>Show {areas.length - AREAS_SHOWN} more areas</summary>
                <ul className={styles.chips}>
                  {areas.slice(AREAS_SHOWN).map((a) => (
                    <li key={a.slug}>
                      <Link href={`/cities/chennai/${a.slug}`}>{a.name}</Link>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
