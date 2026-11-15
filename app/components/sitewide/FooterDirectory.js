import Link from "next/link";
import { carTypes } from "@/lib/cars";
import { getCityBySlug } from "@/lib/cities";
import { getFleetSummary } from "@/lib/landing";
import FooterGroup from "./FooterGroup";
import styles from "./FooterDirectory.module.css";

// Footer link directory (like Zoomcar's "Car rental services in India"): every area page, every
// car type and every car in the live fleet, for the two cities shown to Google. Coimbatore stays
// hidden. Server component — the fleet comes from Supabase and refreshes hourly; if it can't be
// loaded the car links are left out and the area and type links still render.
// On phones the repeated "Car rental in" / "in Chennai" parts are visually hidden (still in the
// link text for search engines and screen readers) so the two-column list doesn’t truncate.
const CITIES = [
  { slug: "chennai", fleet: "Chennai" },
  { slug: "bangalore", fleet: "Bengaluru" }, // the vehicles table spells it Bengaluru
];

export default async function FooterDirectory() {
  const blocks = await Promise.all(
    CITIES.map(async ({ slug, fleet }) => {
      const city = getCityBySlug(slug);
      const summary = await getFleetSummary(fleet);
      return {
        slug,
        name: city.name,
        areas: city.areas,
        types: summary?.types ?? carTypes,
        models: summary?.models ?? [],
      };
    })
  );

  return (
    <nav className={styles.directory} aria-label="Self-drive car rental by area and car">
      {blocks.map((b) => (
        <FooterGroup key={`${b.slug}-areas`} title={`Self-drive car rental in ${b.name}`} count={`${b.areas.length} areas`}>
          <ul className={styles.links}>
            <li>
              <Link href={`/cities/${b.slug}`} className={styles.lead}>
                Car rental in {b.name}
              </Link>
            </li>
            {b.areas.map((a) => (
              <li key={a.slug}>
                <Link href={`/cities/${b.slug}/${a.slug}`}>
                  <span className={styles.extra}>Car rental in </span>
                  {a.name}
                </Link>
              </li>
            ))}
          </ul>
        </FooterGroup>
      ))}

      {blocks.map((b) => (
        <FooterGroup
          key={`${b.slug}-cars`}
          title={`Cars available in ${b.name}`}
          count={b.models.length ? `${b.models.length} models` : `${b.types.length} types`}
        >
          <ul className={styles.links}>
            {b.types.map((t) => (
              <li key={t.slug}>
                <Link href={`/cities/${b.slug}/${t.slug}`}>
                  {t.label}
                  <span className={styles.extra}> in {b.name}</span>
                </Link>
              </li>
            ))}
            {b.models.map((m) => (
              <li key={m.slug}>
                <Link href={`/rent/${m.slug}/${b.slug}`}>
                  {m.name}
                  <span className={styles.extra}> in {b.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </FooterGroup>
      ))}
    </nav>
  );
}
