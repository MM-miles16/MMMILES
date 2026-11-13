"use client";
import { useEffect, useRef, useState } from "react";
import ui from "./ui.module.css";
import styles from "./HowItWorks.module.css";

// A car drives along a winding road and stops at each step; when it arrives, the step's sketched
// icon draws itself stroke by stroke. Wide screens: the road snakes across the row (steps alternate
// top and bottom lanes). Narrow screens: the road wiggles down the left side of a list.
// Icons are line drawings on a 48×48 grid, one stroke per path so each can draw in turn.
const STEPS = [
  {
    title: "Search & pick your dates",
    desc: "Pick your city, pickup spot and dates. This weekend is one tap.",
    tone: styles.toneSky,
    sketch: [
      "M26 38H12a4 4 0 0 1-4-4V15a4 4 0 0 1 4-4h20a4 4 0 0 1 4 4v9", // calendar
      "M8 18h28",
      "M15 7v6",
      "M29 7v6",
      "M13.5 27.5l3 3 5.5-5.5", // picked date
      "M40 33a6 6 0 1 1-12 0a6 6 0 1 1 12 0", // search lens
      "M38.4 37.4l4.1 4.1",
    ],
  },
  {
    title: "Choose your car",
    desc: "See the all-in price, and what it costs each when friends split.",
    tone: styles.toneLavender,
    sketch: [
      "M9 33H6.5A1.5 1.5 0 0 1 5 31.5V26a3 3 0 0 1 2.3-2.9L14 21.5l5-6.2a3 3 0 0 1 2.3-1.1h9.8a3 3 0 0 1 2.3 1.1l5 6.2 3.4 1A3 3 0 0 1 44 25.4v6.1a1.5 1.5 0 0 1-1.5 1.5H40", // body
      "M17 33h15",
      "M14 21.5h24",
      "M25 14.2v7.3",
      "M17 33a4 4 0 1 1-8 0a4 4 0 1 1 8 0", // wheels
      "M40 33a4 4 0 1 1-8 0a4 4 0 1 1 8 0",
      "M41 4v6", // sparkle
      "M38 7h6",
    ],
  },
  {
    title: "Pay securely",
    desc: "Pay by UPI or card. No deposit, nothing blocked.",
    tone: styles.tonePeach,
    sketch: [
      "M16 5h12a4 4 0 0 1 4 4v30a4 4 0 0 1-4 4H16a4 4 0 0 1-4-4V9a4 4 0 0 1 4-4z", // phone
      "M20 9.5h4",
      "M28 23a6 6 0 1 1-12 0a6 6 0 1 1 12 0", // coin
      "M19.5 23l2 2 3.5-3.5",
      "M36 19a5 5 0 0 1 0 8", // tap to pay
      "M39.5 16a9.5 9.5 0 0 1 0 14",
      "M20 37.5h4",
    ],
  },
  {
    title: "Doorstep delivery or host pickup",
    desc: "We bring the car to your door, or you pick it up nearby.",
    tone: styles.toneMint,
    sketch: [
      "M6 23L22 10l16 13", // roof
      "M10 20v18h24V20",
      "M18.5 38v-8h7v8", // door
      "M38 4a5 5 0 0 0-5 5c0 3.8 5 8 5 8s5-4.2 5-8a5 5 0 0 0-5-5z", // location pin
      "M39.6 9a1.6 1.6 0 1 1-3.2 0a1.6 1.6 0 1 1 3.2 0",
    ],
  },
  {
    title: "Ride safe",
    desc: "Every trip is insured, with 24×7 support a call away.",
    tone: styles.toneMidnight,
    sketch: [
      "M24 5l14 5v11c0 9.2-6 16.6-14 19.5C16 37.6 10 30.2 10 21V10z", // shield
      "M17.5 22.5l4.5 4.5 8.5-9",
    ],
  },
];

// A faint pencil outline until the step is reached, then the coloured strokes draw in
function Sketch({ paths }) {
  return (
    <svg viewBox="0 0 48 48" className={styles.sketch} aria-hidden="true" focusable="false">
      <g className={styles.ghost}>
        {paths.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
      <g className={styles.ink}>
        {paths.map((d, i) => (
          <path key={d} d={d} pathLength="1" style={{ "--i": i }} />
        ))}
      </g>
    </svg>
  );
}
const DONE = STEPS.length + 1; // "reached" value once the car is parked at the finish

// Road geometry in SVG units. reach: how close the car's centre gets to a step's circle before it
// stops; endGap: where it parks before the finish dot.
const WIDE = {
  w: 1160,
  h: 260,
  road: "M40 130 V86 A44 44 0 0 1 84 42 H212 A44 44 0 0 1 256 86 V174 A44 44 0 0 0 300 218 H428 A44 44 0 0 0 472 174 V86 A44 44 0 0 1 516 42 H644 A44 44 0 0 1 688 86 V174 A44 44 0 0 0 732 218 H860 A44 44 0 0 0 904 174 V86 A44 44 0 0 1 948 42 H1076 A44 44 0 0 1 1120 86 V130",
  centers: [
    [148, 42],
    [364, 218],
    [580, 42],
    [796, 218],
    [1012, 42],
  ],
  end: [1120, 130],
  reach: 61,
  endGap: 33,
  parked: "translate(1120 97) rotate(90)",
};
// Phones and tablets: a short wavy road across the top of an app-style card, with numbered stops
const CARD = {
  w: 340,
  h: 64,
  road: "M6 40 H56 C86 40 86 24 116 24 C146 24 146 40 176 40 C206 40 206 24 236 24 C266 24 266 40 296 40 H334",
  centers: [
    [56, 40],
    [116, 24],
    [176, 40],
    [236, 24],
    [296, 40],
  ],
  end: [334, 40],
  reach: 27,
  endGap: 21,
  parked: "translate(313 40)",
};

const DRIVE_S = 7.2; // total driving time per loop; plus a pause at every step
const DWELL_S = 1.1;
const FINISH_S = 1.8;
const FADE_S = 0.35;
const ease = (p) => 0.5 - Math.cos(Math.PI * p) / 2;

// Distances along the road where the car stops, and the loop's timeline
function buildPlan(path, geo) {
  const total = path.getTotalLength();
  const stops = [];
  let from = 0;
  for (const [cx, cy] of geo.centers) {
    let at = total;
    for (let len = from; len <= total; len += 1) {
      const p = path.getPointAtLength(len);
      if (Math.hypot(p.x - cx, p.y - cy) <= geo.reach) {
        at = len;
        break;
      }
    }
    stops.push(at);
    from = at + 1;
  }
  const speed = total / DRIVE_S;
  const segs = [];
  let t = 0;
  const push = (seg) => {
    segs.push({ ...seg, t0: t });
    t += seg.dur;
  };
  push({ at: 0, dur: 0.6 });
  let pos = 0;
  [...stops, total - geo.endGap].forEach((to, k) => {
    push({ from: pos, to, dur: Math.max(0.5, (to - pos) / speed) });
    push({ at: to, dur: k < stops.length ? DWELL_S : FINISH_S, reach: k + 1 });
    pos = to;
  });
  return { total, segs, length: t, parkAt: total - geo.endGap };
}

// Top-down car, nose pointing along +x
function Car({ carRef, scale = 1, parked }) {
  return (
    <g ref={carRef} transform={parked} className={styles.car}>
      <g transform={`scale(${scale})`}>
        <rect x="-22" y="-10" width="48" height="26" rx="9" fill="rgba(34,34,46,0.16)" />
        <rect x="-17" y="-15" width="10" height="5" rx="2" fill="#15151c" />
        <rect x="8" y="-15" width="10" height="5" rx="2" fill="#15151c" />
        <rect x="-17" y="10" width="10" height="5" rx="2" fill="#15151c" />
        <rect x="8" y="10" width="10" height="5" rx="2" fill="#15151c" />
        <rect x="-24" y="-12" width="48" height="24" rx="9" fill="#22222e" />
        <rect x="-12" y="-9.5" width="15" height="19" rx="4" fill="#34344a" />
        <rect x="4" y="-9" width="9" height="18" rx="3" fill="#c5b5ee" />
        <rect x="-18.5" y="-8" width="5" height="16" rx="2" fill="#c5b5ee" opacity="0.75" />
        <rect x="20.5" y="-10" width="2.5" height="4" rx="1" fill="#fff3b0" />
        <rect x="20.5" y="6" width="2.5" height="4" rx="1" fill="#fff3b0" />
        <rect x="-24" y="-10" width="2" height="4" rx="1" fill="#ff6b6b" />
        <rect x="-24" y="6" width="2" height="4" rx="1" fill="#ff6b6b" />
      </g>
    </g>
  );
}

function Road({ trailRef, carRef, finished }) {
  return (
    <svg className={styles.wideRoad} viewBox={`0 0 ${WIDE.w} ${WIDE.h}`} aria-hidden="true" focusable="false">
      <path d={WIDE.road} className={styles.roadBase} />
      <path d={WIDE.road} className={styles.roadTrail} ref={trailRef} />
      <path d={WIDE.road} className={styles.roadLine} />
      <circle cx={WIDE.end[0]} cy={WIDE.end[1]} r="8" className={`${styles.finish} ${finished ? styles.finishOn : ""}`} />
      <Car carRef={carRef} parked={WIDE.parked} />
    </svg>
  );
}

// The phone card's road: the car drives under numbered stops; tapping a stop jumps to that step
function CardRoad({ trailRef, carRef, reached, started, onStop }) {
  return (
    <svg className={styles.cardRoad} viewBox={`0 0 ${CARD.w} ${CARD.h}`} focusable="false">
      <path d={CARD.road} className={styles.roadBase} />
      <path d={CARD.road} className={styles.roadTrail} ref={trailRef} />
      <path d={CARD.road} className={styles.roadLine} />
      <circle cx={CARD.end[0]} cy={CARD.end[1]} r="5" className={`${styles.finish} ${reached === DONE ? styles.finishOn : ""}`} />
      <Car carRef={carRef} scale={0.55} parked={CARD.parked} />
      {CARD.centers.map(([x, y], i) => (
        <g
          key={x}
          className={`${styles.stop} ${i < reached ? styles.stopOn : ""} ${started && i === reached - 1 ? styles.stopNow : ""}`}
          onClick={() => onStop(i)}
        >
          <circle cx={x} cy={y} r="11" />
          <text x={x} y={y} dy="0.35em" textAnchor="middle">
            {i + 1}
          </text>
        </g>
      ))}
    </svg>
  );
}

export default function HowItWorks() {
  const boxRef = useRef(null);
  const wideTrail = useRef(null);
  const wideCar = useRef(null);
  const cardTrail = useRef(null);
  const cardCar = useRef(null);
  const swipeX = useRef(null);
  const plan = useRef(null);
  const clock = useRef(0);
  const reachedRef = useRef(DONE);
  const [wide, setWide] = useState(null); // null until we know which road is on screen
  const [reached, setReached] = useState(DONE); // everything shows until the drive starts
  const [started, setStarted] = useState(false);
  const [inView, setInView] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const playing = started && inView && !reducedMotion;

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1000px)");
    const update = () => setWide(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  // Play only while the road is on screen; the first time it shows, the drive starts
  useEffect(() => {
    const el = boxRef.current;
    if (!el || !("IntersectionObserver" in window)) return setInView(true);
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (inView && !reducedMotion) setStarted(true);
  }, [inView, reducedMotion]);

  const showReached = (n) => {
    if (reachedRef.current === n) return;
    reachedRef.current = n;
    setReached(n);
  };

  const parts = () => (wide ? { trail: wideTrail.current, car: wideCar.current } : { trail: cardTrail.current, car: cardCar.current });

  const place = (len, opacity) => {
    const { trail, car } = parts();
    const p = plan.current;
    const pt = trail.getPointAtLength(len);
    const a = trail.getPointAtLength(Math.max(0, len - 1));
    const b = trail.getPointAtLength(Math.min(p.total, len + 1));
    const angle = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
    car.setAttribute("transform", `translate(${pt.x.toFixed(2)} ${pt.y.toFixed(2)}) rotate(${angle.toFixed(1)})`);
    car.style.opacity = opacity;
    trail.style.strokeDasharray = `${len} ${p.total + 10}`;
    trail.style.opacity = opacity;
  };

  const draw = (t) => {
    const p = plan.current;
    const tt = t % p.length;
    let len = 0;
    let reach = 0;
    for (const s of p.segs) {
      if (s.reach && s.t0 <= tt) reach = s.reach;
      if (tt >= s.t0 && tt < s.t0 + s.dur) len = s.at ?? s.from + (s.to - s.from) * ease((tt - s.t0) / s.dur);
    }
    const opacity = Math.min(1, tt / FADE_S, (p.length - tt) / FADE_S);
    place(len, Math.max(0, opacity));
    showReached(reach);
  };

  const jumpTo = (k) => {
    const p = plan.current;
    if (!p || k < 0 || k >= STEPS.length) return;
    clock.current = p.segs.find((seg) => seg.reach === k + 1).t0 + 0.001;
    draw(clock.current);
  };

  // The finished picture: car parked at the end, the whole road driven, every step shown
  const drawParked = () => {
    const { trail, car } = parts();
    car.setAttribute("transform", (wide ? WIDE : CARD).parked);
    car.style.opacity = 1;
    trail.style.strokeDasharray = "none";
    trail.style.opacity = 1;
    showReached(DONE);
  };

  // Measure the road that's on screen and lay out the loop
  useEffect(() => {
    if (wide === null) return;
    const { trail } = parts();
    plan.current = buildPlan(trail, wide ? WIDE : CARD);
    clock.current = 0;
    if (started && !reducedMotion) draw(0);
    else drawParked();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wide, started, reducedMotion]);

  useEffect(() => {
    if (!playing || !plan.current) return;
    let raf;
    let last = performance.now();
    const tick = (now) => {
      clock.current += Math.min(0.1, (now - last) / 1000);
      last = now;
      draw(clock.current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, wide]);

  // The step the phone card shows: the one the car is at (step 1 while it sets off)
  const shown = Math.min(Math.max(reached, 1), STEPS.length) - 1;

  return (
    <section id="how-it-works" className={`${ui.section} ${styles.section}`} aria-labelledby="how-title">
      <div className={ui.container}>
        <div className={`${ui.head} ${styles.head}`}>
          <p className={ui.eyebrow}>How it works</p>
          <h2 id="how-title" className={ui.title}>
            Your car in 5 easy steps
          </h2>
          <p className={ui.lead}>From search to steering wheel, the whole booking happens on your phone.</p>
        </div>

        <div ref={boxRef} className={styles.roadBox} data-reached={reached}>
          <Road trailRef={wideTrail} carRef={wideCar} finished={reached === DONE} />

          {/* Phones and tablets: an app-style card that shows the step the car has reached */}
          <div
            className={styles.appCard}
            onPointerDown={(e) => (swipeX.current = e.clientX)}
            onPointerUp={(e) => {
              if (swipeX.current === null) return;
              const dx = e.clientX - swipeX.current;
              swipeX.current = null;
              if (Math.abs(dx) > 40) jumpTo(shown + (dx < 0 ? 1 : -1));
            }}
            onPointerCancel={() => (swipeX.current = null)}
            aria-hidden="true"
          >
            <CardRoad trailRef={cardTrail} carRef={cardCar} reached={reached} started={started} onStop={jumpTo} />
            <div key={shown} className={styles.slide}>
              <span className={`${styles.bigIcon} ${STEPS[shown].tone} ${reached > shown ? styles.on : ""}`}>
                <Sketch paths={STEPS[shown].sketch} />
              </span>
              <span className={styles.stepOf}>
                Step {shown + 1} of {STEPS.length}
              </span>
              <span className={styles.slideTitle}>{STEPS[shown].title}</span>
              <span className={styles.slideDesc}>{STEPS[shown].desc}</span>
            </div>
          </div>

          <ol className={styles.steps}>
            {STEPS.map((s, i) => {
              const on = i < reached;
              const now = started && i === reached - 1;
              return (
                <li
                  key={s.title}
                  className={`${styles.step} ${on ? styles.on : ""} ${now ? styles.now : ""}`}
                  style={{ "--x": WIDE.centers[i][0], "--lane": WIDE.centers[i][1] }}
                >
                  <span className={`${styles.circle} ${s.tone}`} aria-hidden="true">
                    <Sketch paths={s.sketch} />
                  </span>
                  <span className={styles.text}>
                    <span className={styles.num}>{String(i + 1).padStart(2, "0")}</span>
                    <span className={styles.stepTitle}>{s.title}</span>
                  </span>
                </li>
              );
            })}
          </ol>
        </div>

        <div className={styles.cta}>
          <a href="#search" className={`${ui.btn} ${ui.btnDark}`}>
            Start booking
          </a>
        </div>
      </div>
    </section>
  );
}
