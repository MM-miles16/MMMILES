import styles from "./HostMap.module.css";

/* South India map for the host section: a solid lavender land shape with depth, a light dot
   texture over it, and dot pins for Chennai, Bengaluru and Hyderabad joined by routes.
   Coastline is (lon, lat), projected flat with x scaled by cos 15° so the shape isn't stretched.
   The crop stops at 20.5°N; the top and bottom edges fade out (see HostMap.module.css). */
const LON0 = 72;
const LAT1 = 20.5;
const K = 40;
const C = 0.966;
export const MAP_W = 580;
export const MAP_H = 520;
const px = ([lon, lat]) => [+((lon - LON0) * C * K).toFixed(1), +((LAT1 - lat) * K).toFixed(1)];
const path = (pts) => "M" + pts.map((p) => px(p).join(" ")).join("L") + "Z";

const MAINLAND = [
  [70, 23], [72.6, 22.25], [72.75, 21.7], [72.65, 21.2], [72.85, 20.6], [72.8, 19.9], [72.75, 19.3],
  [72.9, 18.9], [73, 18.2], [73.25, 17.3], [73.4, 16.6], [73.6, 16], [73.8, 15.5], [74, 15],
  [74.3, 14.4], [74.55, 13.7], [74.75, 13], [74.95, 12.5], [75.3, 11.9], [75.7, 11.4], [75.9, 10.9],
  [76.1, 10.3], [76.3, 9.7], [76.45, 9.2], [76.7, 8.75], [77.1, 8.3], [77.55, 8.07], [77.95, 8.35],
  [78.15, 8.75], [78.25, 9.15], [78.75, 9.25], [79.1, 9.3], [79.3, 9.75], [79.3, 10.2], [79.85, 10.3],
  [79.85, 10.8], [79.8, 11.4], [79.85, 11.9], [80.1, 12.4], [80.25, 13], [80.32, 13.6], [80.2, 14.3],
  [80.1, 15], [80.25, 15.6], [80.7, 15.9], [81.2, 16.2], [81.6, 16.35], [82.2, 16.6], [82.35, 17],
  [82.9, 17.4], [83.4, 17.75], [84, 18.2], [84.6, 18.9], [85.1, 19.4], [85.7, 19.75], [86.3, 20],
  [86.8, 20.4], [86.95, 20.9], [87, 21.45], [87.6, 21.65], [90, 21.8], [90, 23],
];
const SRI_LANKA = [
  [79.85, 9.8], [80.25, 9.83], [80.6, 9.4], [80.9, 8.95], [81.25, 8.5], [81.45, 7.95], [81.75, 7.3],
  [81.85, 6.7], [81.6, 6.35], [81.1, 6.1], [80.6, 5.95], [80.15, 6.1], [79.95, 6.6], [79.85, 7.2],
  [79.8, 7.9], [79.75, 8.6], [79.9, 9.1], [79.95, 9.5],
];
const LAND_D = path(MAINLAND);
const LANKA_D = path(SRI_LANKA);

export const CITIES = [
  { key: "chennai", name: "Chennai", at: px([80.27, 13.08]), side: "right", hub: true },
  { key: "bengaluru", name: "Bengaluru", at: px([77.59, 12.97]), side: "left" },
  { key: "hyderabad", name: "Hyderabad", at: px([78.47, 17.39]), side: "right" },
];
const [CHN, BLR, HYD] = CITIES.map((c) => c.at);
const q = (a, ctrl, b) => `M${a.join(" ")}Q${ctrl.join(" ")} ${b.join(" ")}`;
const ROUTES = [q(CHN, [268, 250], BLR), q(CHN, [330, 190], HYD), q(BLR, [196, 200], HYD)];

// left/top as a percentage of the map box, for HTML overlays
export const mapPct = ([x, y]) => ({ left: `${((x / MAP_W) * 100).toFixed(2)}%`, top: `${((y / MAP_H) * 100).toFixed(2)}%` });

// `id` must be unique on the page (it names the SVG gradient, texture and shadow).
// tone: "light" (lavender on light panels) or "dark" (glowing, for midnight panels).
export default function HostMap({ id, tone = "light", className = "", children }) {
  return (
    <span className={`${styles.map} ${styles[tone]} ${className}`} aria-hidden="true">
      <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} className={styles.svg}>
        <defs>
          <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0.7" y2="1">
            <stop offset="0" className={styles.stopA} />
            <stop offset="1" className={styles.stopB} />
          </linearGradient>
          <pattern id={`${id}-dots`} width="10" height="10" patternUnits="userSpaceOnUse">
            <circle cx="5" cy="5" r="1.6" className={styles.texture} />
          </pattern>
          <filter id={`${id}-depth`} x="-15%" y="-15%" width="130%" height="140%">
            <feDropShadow dx="0" dy="14" stdDeviation="14" className={styles.shadow} />
          </filter>
        </defs>
        <path d={LANKA_D} className={styles.neighbour} />
        <path d={LAND_D} fill={`url(#${id}-fill)`} filter={`url(#${id}-depth)`} className={styles.land} />
        <path d={LAND_D} fill={`url(#${id}-dots)`} />
        {ROUTES.map((d) => (
          <path key={d} d={d} pathLength="1" className={styles.route} />
        ))}
        {CITIES.map((c) =>
          c.hub ? (
            <g key={c.key} transform={`translate(${c.at.join(" ")})`}>
              <circle r="15" className={styles.pulse} />
              <circle r="11" className={styles.hubHalo} />
              <circle r="6.5" className={styles.dot} />
            </g>
          ) : (
            <circle key={c.key} cx={c.at[0]} cy={c.at[1]} r="6" className={styles.dot} />
          )
        )}
      </svg>
      {CITIES.map((c) => (
        <span key={c.key} className={`${styles.label} ${styles[c.side]} ${c.hub ? styles.hubLabel : ""}`} style={mapPct(c.at)}>
          {c.name}
        </span>
      ))}
      {children}
    </span>
  );
}
