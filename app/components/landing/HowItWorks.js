"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  ArrowRight,
  Check,
  CreditCard,
  Headset,
  House,
  Landmark,
  Lock,
  MapPin,
  Pause,
  Play,
  Search,
  ShieldCheck,
  Smartphone,
  Store,
  Users,
} from "lucide-react";
import { calculatePricing } from "@/lib/pricing";
import { formatINR, perPerson } from "@/lib/tripPrice";
import ui from "./ui.module.css";
import styles from "./HowItWorks.module.css";

// Five compact step cards. Each tile holds a small app screen that plays its moment while the
// step is active; the other tiles show the finished state. The active card's progress bar drives
// the timing (its animationend advances), so pausing the CSS pauses everything.
const STEP_MS = 4600;

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const at = (d) => `${WEEKDAYS[d.getDay()]} ${d.getDate()}, ${d.getHours() % 12 || 12} ${d.getHours() < 12 ? "AM" : "PM"}`;

// Upcoming weekend (Sat 9 AM → Sun 9 PM, same as the "This weekend" quick pick) and Thu–Mon around it
function upcomingWeekend(now) {
  const day = now.getDay();
  const start = new Date(now);
  start.setDate(now.getDate() + (day === 0 ? 6 : 6 - day));
  start.setHours(9, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 1);
  end.setHours(21, 0, 0, 0);
  const days = [-2, -1, 0, 1, 2].map((offset) => {
    const d = new Date(start);
    d.setDate(start.getDate() + offset);
    return { dow: WEEKDAYS[d.getDay()], date: d.getDate(), weekend: offset === 0 || offset === 1 };
  });
  return { start, end, days };
}

const PLACEHOLDER_DAYS = ["Thu", "Fri", "Sat", "Sun", "Mon"].map((dow, i) => ({ dow, date: "", weekend: i === 2 || i === 3 }));

/* ── Step illustrations (decorative; built from spans because they sit inside buttons) ── */

function SceneSearch({ ctx }) {
  let n = 0;
  return (
    <span className={`${styles.scene} ${styles.sSearch}`}>
      <span className={styles.ui}>
        <span className={styles.loc}>
          <MapPin /> Anna Nagar, Chennai
        </span>
        <span className={styles.days}>
          {ctx.days.map((d, i) => (
            <span
              key={i}
              className={`${styles.day} ${d.weekend ? styles.daySel : ""}`}
              style={d.weekend ? { "--n": n++ } : undefined}
            >
              <small>{d.dow}</small>
              <b>{d.date || " "}</b>
            </span>
          ))}
        </span>
        <span className={styles.chips}>
          <span className={styles.chip}>Tomorrow</span>
          <span className={`${styles.chip} ${styles.chipSel}`}>
            This weekend
            <i className={styles.tap} />
          </span>
        </span>
        <span className={styles.searchBtn}>
          <Search /> Search cars
          <i className={styles.tap} />
        </span>
      </span>
      <Image src="/landing/3d/spiral-calendar.webp" alt="" width={120} height={120} className={styles.sticker} />
    </span>
  );
}

function SceneCar({ ctx }) {
  const c = ctx.car;
  return (
    <span className={`${styles.scene} ${styles.sCar}`}>
      <span className={`${styles.ui} ${styles.carBack}`}>
        <span className={styles.carPhoto}>
          <Image src="/landing/cars/swift.webp" alt="" width={520} height={265} />
        </span>
        <b className={styles.carName}>Maruti Swift</b>
        <small className={styles.carMeta}>Automatic · 5 seats</small>
      </span>
      <span className={`${styles.ui} ${styles.carFront}`}>
        <span className={styles.carPhoto}>
          <Image src="/landing/cars/venue.webp" alt="" width={520} height={248} />
        </span>
        <b className={styles.carName}>Hyundai Venue</b>
        <small className={styles.carMeta}>Automatic · 5 seats</small>
        {c ? (
          <>
            <span className={styles.carPrice}>
              {formatINR(c.total)} <small>all-in</small>
            </span>
            <span className={styles.split}>
              <Users /> {formatINR(c.each)} each for {c.people}
            </span>
          </>
        ) : (
          <span className={styles.carPrice}>
            <small>All-in price, no surprises</small>
          </span>
        )}
        <span className={styles.carCheck}>
          <Check />
        </span>
        <i className={styles.tap} />
      </span>
    </span>
  );
}

function ScenePay({ ctx }) {
  const total = ctx.car?.total;
  return (
    <span className={`${styles.scene} ${styles.sPay}`}>
      <span className={styles.ui}>
        <small className={styles.payLabel}>Total · all-in</small>
        <b className={styles.payTotal}>{total ? formatINR(total) : "Full price"}</b>
        <span className={styles.methods}>
          <span className={`${styles.method} ${styles.methodSel}`}>
            <Smartphone /> UPI
          </span>
          <span className={styles.method}>
            <CreditCard /> Card
          </span>
          <span className={styles.method}>
            <Landmark /> Bank
          </span>
        </span>
        <span className={styles.payBtn}>
          <span className={styles.payIdle}>
            <Lock /> {total ? `Pay ${formatINR(total)}` : "Pay securely"}
          </span>
          <i className={styles.spinner} />
          <span className={styles.payDone}>
            <Check /> Payment successful
          </span>
          <i className={styles.tap} />
        </span>
        <small className={styles.secure}>
          <Lock /> Secured by Razorpay · ₹0 deposit
        </small>
      </span>
      <Image src="/landing/3d/wallet.webp" alt="" width={120} height={120} className={styles.sticker} />
    </span>
  );
}

function SceneHandover({ ctx }) {
  return (
    <span className={`${styles.scene} ${styles.sHand}`}>
      <span className={styles.ui}>
        <span className={styles.seg}>
          <span className={styles.segThumb} />
          <span className={`${styles.segOpt} ${styles.segDoor}`}>
            <House /> Doorstep
            <i className={styles.tap} />
          </span>
          <span className={`${styles.segOpt} ${styles.segHost}`}>
            <Store /> Host pickup
          </span>
        </span>
        <span className={styles.map}>
          <svg viewBox="0 0 212 80" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <rect width="212" height="80" fill="#e9f1fa" />
            <path d="M146 80 C 158 62 184 56 212 54 V 80 Z" fill="#d3e6f8" />
            <ellipse cx="46" cy="20" rx="28" ry="12" fill="#d6eedc" />
            <ellipse cx="128" cy="68" rx="20" ry="9" fill="#d6eedc" />
            <g stroke="#ffffff" strokeWidth="6" strokeLinecap="round" fill="none">
              <path d="M-6 48 H 218" />
              <path d="M100 -6 V 86" />
              <path d="M-6 6 C 60 16 140 20 218 10" />
              <path d="M168 -6 C 160 30 174 58 162 86" />
            </g>
            <path className={styles.route} d="M30 62 C 54 54 74 48 100 48 S 150 30 178 19" pathLength="1" />
            <circle className={`${styles.pulse} ${styles.pulseHost}`} cx="30" cy="62" r="10" />
            <circle cx="30" cy="62" r="5.5" fill="#ffffff" stroke="#6b57c4" strokeWidth="3" />
            <circle className={`${styles.pulse} ${styles.pulseHome}`} cx="178" cy="19" r="11" />
            <g className={styles.pinHome}>
              <circle cx="178" cy="19" r="7" fill="#22222e" />
              <circle cx="178" cy="19" r="2.6" fill="#ffffff" />
            </g>
          </svg>
        </span>
        <span className={styles.handInfo}>
          <span className={`${styles.info} ${styles.infoHost}`}>
            <span className={styles.infoIcon}>
              <Store />
            </span>
            <span>
              <b>Pick up from the host</b>
              <small>Nolambur hub · 2.4 km away</small>
            </span>
          </span>
          <span className={`${styles.info} ${styles.infoDoor}`}>
            <span className={styles.infoIcon}>
              <House />
            </span>
            <span>
              <b>Delivered to your door</b>
              <small>Anna Nagar · {ctx.pickup}</small>
            </span>
          </span>
        </span>
      </span>
    </span>
  );
}

function SceneRide() {
  return (
    <span className={`${styles.scene} ${styles.sRide}`}>
      <span className={styles.live}>
        <i className={styles.liveDot} /> Trip in progress
      </span>
      <span className={styles.rideBadges}>
        <span className={`${styles.badge} ${styles.badgeInsured}`}>
          <ShieldCheck /> Insured
        </span>
        <span className={`${styles.badge} ${styles.badgeSupport}`}>
          <Headset /> 24×7 support
        </span>
      </span>
      <i className={styles.floor} />
      <i className={styles.ring} />
      <span className={styles.rideCar}>
        <Image src="/landing/cars/venue.webp" alt="" width={520} height={248} />
        <i className={`${styles.light} ${styles.lightL}`} />
        <i className={`${styles.light} ${styles.lightR}`} />
      </span>
    </span>
  );
}

const STEPS = [
  { title: "Search & pick your dates", tone: styles.toneSky, Scene: SceneSearch },
  { title: "Choose your car", tone: styles.toneLavender, Scene: SceneCar },
  { title: "Pay securely", tone: styles.toneMist, Scene: ScenePay },
  { title: "Doorstep delivery or host pickup", tone: styles.toneSkySoft, Scene: SceneHandover },
  { title: "Ride safe", tone: styles.toneMidnight, Scene: SceneRide },
];
const LAST = STEPS.length - 1;

export default function HowItWorks({ rates }) {
  const rootRef = useRef(null);
  const railRef = useRef(null);
  const cardRefs = useRef([]);
  const autoScroll = useRef(false); // true while the rail scrolls itself to the active card
  // cycle: bumps when the story restarts (the traveller re-enters); hop: bumps on every forward move
  const [{ active, cycle, hop }, setStory] = useState({ active: 0, cycle: 0, hop: 0 });
  const [inView, setInView] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [hold, setHold] = useState(false); // mouse over the cards: the timer waits
  const [reducedMotion, setReducedMotion] = useState(false);
  const [week, setWeek] = useState(null); // dates depend on "now", so they're set in the browser
  const paused = userPaused || !inView || reducedMotion;

  useEffect(() => setWeek(upcomingWeekend(new Date())), []);

  // Play only while the section is on screen
  useEffect(() => {
    const el = rootRef.current;
    if (!el || !("IntersectionObserver" in window)) return setInView(true);
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  const goTo = (i) =>
    setStory((s) =>
      i === s.active
        ? s
        : i > s.active
          ? { active: i, cycle: s.cycle, hop: s.hop + 1 }
          : { active: i, cycle: s.cycle + 1, hop: 0 } // going back: re-enter instead of hopping backwards
    );

  const advance = (e) => {
    if (!e.animationName.includes("fill")) return;
    setStory((s) =>
      s.active === LAST ? { active: 0, cycle: s.cycle + 1, hop: 0 } : { active: s.active + 1, cycle: s.cycle, hop: s.hop + 1 }
    );
  };

  // Phones and tablets: bring the active card into view (scrolls the row only, never the page)
  useEffect(() => {
    const rail = railRef.current;
    const card = cardRefs.current[active];
    if (!rail || !card || rail.scrollWidth <= rail.clientWidth + 1) return;
    const pad = parseFloat(getComputedStyle(rail).paddingLeft) || 0;
    const delta = card.getBoundingClientRect().left - rail.getBoundingClientRect().left - pad;
    if (Math.abs(delta) < 2) return;
    autoScroll.current = true;
    rail.scrollTo({ left: rail.scrollLeft + delta, behavior: reducedMotion ? "auto" : "smooth" });
  }, [active, reducedMotion]);

  // A swipe through the cards shows the card it lands on and stops the autoplay
  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    let settle;
    const onScroll = () => {
      clearTimeout(settle);
      settle = setTimeout(() => {
        if (autoScroll.current) {
          autoScroll.current = false;
          return;
        }
        const edge = rail.getBoundingClientRect().left + (parseFloat(getComputedStyle(rail).paddingLeft) || 0);
        const gaps = cardRefs.current.map((el) => Math.abs(el.getBoundingClientRect().left - edge));
        setUserPaused(true);
        goTo(gaps.indexOf(Math.min(...gaps)));
      }, 140);
    };
    const onTouch = () => (autoScroll.current = false);
    const onWheel = (e) => Math.abs(e.deltaX) > Math.abs(e.deltaY) && onTouch();
    rail.addEventListener("scroll", onScroll, { passive: true });
    rail.addEventListener("pointerdown", onTouch, { passive: true });
    rail.addEventListener("wheel", onWheel, { passive: true });
    return () => {
      clearTimeout(settle);
      rail.removeEventListener("scroll", onScroll);
      rail.removeEventListener("pointerdown", onTouch);
      rail.removeEventListener("wheel", onWheel);
    };
  }, []);

  // Live prices for the illustration: same engine as checkout, Hyundai Venue for the upcoming weekend
  const ctx = useMemo(() => {
    if (!week) return { days: PLACEHOLDER_DAYS, pickup: "Sat, 9 AM", car: null };
    const rate = rates?.["hyundai venue"];
    let car = null;
    if (rate) {
      const pricing = calculatePricing({ baseDailyRate: rate, pickupTime: week.start, returnTime: week.end });
      const split = perPerson(pricing.total, 5);
      car = { total: pricing.total, each: split.each, people: split.people };
    }
    return { days: week.days, pickup: at(week.start), car };
  }, [week, rates]);

  return (
    <section id="how-it-works" className={`${ui.section} ${styles.section}`} aria-labelledby="how-title">
      <div className={ui.container}>
        <div className={`${ui.headRow} ${styles.headRow}`}>
          <div className={ui.head}>
            <p className={ui.eyebrow}>How it works</p>
            <h2 id="how-title" className={`${ui.title} ${styles.title}`}>
              Your car in 5 easy steps
            </h2>
            <p className={`${ui.lead} ${styles.lead}`}>From search to steering wheel, the whole booking happens on your phone.</p>
          </div>
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.playPause}
              onClick={() => setUserPaused((p) => !p)}
              aria-label={userPaused ? "Play the booking steps" : "Pause the booking steps"}
              hidden={reducedMotion}
            >
              {userPaused ? <Play /> : <Pause />}
              <span>{userPaused ? "Play" : "Pause"}</span>
            </button>
            <a href="#search" className={ui.textLink}>
              Start booking <ArrowRight size={16} />
            </a>
          </div>
        </div>

        <div
          ref={rootRef}
          className={`${styles.journey} ${paused ? styles.paused : ""} ${hold ? styles.hold : ""}`}
          data-step={active}
          style={{ "--step-ms": `${STEP_MS}ms` }}
        >
          <div
            className={styles.rail}
            ref={railRef}
            onPointerEnter={(e) => e.pointerType === "mouse" && setHold(true)}
            onPointerLeave={(e) => e.pointerType === "mouse" && setHold(false)}
          >
            <div className={styles.track}>
              <ol className={styles.cards}>
                {STEPS.map(({ title, tone, Scene }, i) => (
                  <li key={title} ref={(el) => (cardRefs.current[i] = el)}>
                    <button
                      type="button"
                      className={`${styles.card} ${i === active ? styles.cardOn : ""} ${i < active ? styles.cardDone : ""}`}
                      aria-current={i === active ? "step" : undefined}
                      onClick={() => goTo(i)}
                    >
                      <span className={`${styles.tile} ${tone}`} aria-hidden="true">
                        <Scene ctx={ctx} />
                      </span>
                      <span className={styles.meta}>
                        <span className={styles.stepNo}>Step {i + 1}</span>
                        <span className={styles.stepTitle}>{title}</span>
                        <span className={styles.bar} aria-hidden="true">
                          <i onAnimationEnd={i === active ? advance : undefined} />
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ol>

              {/* The traveller hops from card to card, then climbs into the car on the last one */}
              <div
                key={cycle}
                className={`${styles.manPos} ${active === LAST ? styles.manLast : ""}`}
                style={{ "--i": active }}
                aria-hidden="true"
              >
                <span
                  key={`h${hop}`}
                  className={`${styles.manHop} ${hop ? styles.hopping : ""} ${hop && active === LAST ? styles.boarding : ""}`}
                >
                  <Image src="/landing/3d/man-walking.webp" alt="" width={120} height={120} className={styles.manIdle} />
                  <Image src="/landing/3d/man-running.webp" alt="" width={120} height={120} className={styles.manRun} />
                </span>
                <span
                  key={`s${hop}`}
                  className={`${styles.manShadow} ${hop ? styles.shadowHop : ""} ${hop && active === LAST ? styles.shadowBoard : ""}`}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
