"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import styles from "./HostLanding.module.css";

export default function HostLanding() {

  const router = useRouter();

  /* =========================
      STATS COUNTER
  ========================= */

  const statsRef = useRef(null);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [counts, setCounts] = useState({
    hosts: 0,
    experience: 0,
    bookings: 0,
  });

  useEffect(() => {

    const section = statsRef.current;

    if (!section) return;

    let counter;

    const startCounter = () => {

      let current = 0;

      const endValues = {
        hosts: 1500,
        experience: 10,
        bookings: 300,
      };

      const duration = 2000;

      const fps = 60;

      const totalFrames = Math.round((duration / 1000) * fps);

      clearInterval(counter);

      counter = setInterval(() => {

        current++;

        const progress = current / totalFrames;

        setCounts({

          hosts: Math.floor(progress * endValues.hosts),

          experience: Math.floor(progress * endValues.experience),

          bookings: Math.floor(progress * endValues.bookings),

        });

        if (current >= totalFrames) {

          clearInterval(counter);

          setCounts({
            hosts: endValues.hosts,
            experience: endValues.experience,
            bookings: endValues.bookings,
          });

        }

      }, 1000 / fps);

    };

    const observer = new IntersectionObserver(

      ([entry]) => {

        if (entry.isIntersecting) {

          setCounts({
            hosts: 0,
            experience: 0,
            bookings: 0,
          });

          startCounter();

        }

      },

      {
        threshold:0.5,
      }

    );

    observer.observe(section);

    return () => {

      observer.disconnect();

      clearInterval(counter);

    };

  }, []);

  /* =========================
      FEEDBACK SLIDER
  ========================= */

  const feedbacks = [

    {
      name: "Krunal Iyer",
      role: "Fleet Host",
      image: "/krunal.webp",
      text: `
        I listed my car on MM Miles a one months ago, and the entire experience has been smooth. Every booking is clearly visible, payments arrive on time, and I always know what's happening with my vehicle. The transparency gave me confidence from day one, making hosting much easier than I expected.
      `,
    },

    {
      name: "Nisha Gupta",
      role: "Bengalore",
      image: "/nisha.webp",
      text: `
        One thing I really appreciate is the insurance protection provided during bookings. Before joining, I was worried about potential damages, but MM Miles explained everything clearly. Knowing my car is protected has given me peace of mind, allowing me to accept bookings without unnecessary stress.
      `,
    },

    {
      name: "Harsha Kanna",
      role: "Chennai",
      image: "/kanna.webp",
      text: `
        The support team has been outstanding whenever I needed assistance. I once had a question about a booking late in the evening, and they responded quickly with a clear solution. Having reliable support available whenever required makes hosting much more comfortable and dependable.
      `,
    },

    {
      name: "Dayanandh",
      role: "3 cars hosted",
      image: "/dayandh.webp",
      text: `
        A refined platform for car owners.
        Insurance protection is reassuring.
        Support team is available anytime.
        Operations are smooth and transparent.
        Built for long-term hosting.
        Hosting feels structured and secure.
        Insurance coverage is well explained.
        Support is proactive and reliable.
        Earnings are clearly presented.
        Confidence in every booking.
      `,
    },

    {
      name: "Anvitha Gowda",
      role: "Bengalore",
      image: "/Anvitha.webp",
      text: `
        My first booking experience exceeded my expectations. The process was simple, communication was smooth, and the trip was completed without any issues. Seeing everything handled professionally gave me confidence to continue hosting and recommend MM Miles to other car owners.
      `,
    },

    {
      name: "Zaid Khan",
      role: "Chennai",
      image: "/zaid.webp",
      text: `
        Hosting with MM Miles has become a reliable source of additional income. The combination of transparent operations, professional support, insurance protection, and timely payments makes the platform trustworthy. It feels like a long-term partnership rather than just another vehicle rental service.
      `,
    },

  ];

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {

    const interval = setInterval(() => {

      setActiveIndex((prev) =>
        (prev + 1) % feedbacks.length
      );

    }, 3000);

    return () => clearInterval(interval);

  }, []);

  const getPosition = (index) => {

    const prev =
      (activeIndex - 1 + feedbacks.length) % feedbacks.length;

    const next =
      (activeIndex + 1) % feedbacks.length;

    if (index === activeIndex) {
      return styles.hpanelFeedbackCardCenter;
    }

    if (index === prev) {
      return styles.hpanelFeedbackCardLeft;
    }

    if (index === next) {
      return styles.hpanelFeedbackCardRight;
    }

    return styles.hpanelFeedbackHidden;

  };


  return (
    <div className={styles.hpanelPage}>

    {/* Navbar */}
    <section className={styles.hpanelNavSection}>

      {/* NAVBAR */}
      <div className={styles.hpanelNavbar}>

        <div className={styles.hpanelLogoWrapper}>
          <Link href="/">
            <Image
              src="/mlogo.png"
              alt="MM Miles Logo"
              width={110}
              height={33}
              className={styles.hpanelLogoMobile}
              priority
            />
          </Link>
        </div>

        <div className={styles.hpanelNavbarActions}>

          <button className={styles.hpanelLearnBtn}>
            Learn More
          </button>

          <button className={styles.hpanelCallBtn}
          onClick={() => setShowCallModal(true)}>
            
            Request a Call
          </button>

        </div>

      </div>

      {/* REQUEST CALL POPUP */}

  {showCallModal && (

  <div
    className={styles.hpanelModalOverlay}
    onClick={() => setShowCallModal(false)}
  >

    <div
      className={styles.hpanelRequestModal}
      onClick={(e) => e.stopPropagation()}
    >

      <button
        className={styles.hpanelModalClose}
        onClick={() => setShowCallModal(false)}
      >
        ✕
      </button>

      <h2 className={styles.hpanelRequestTitle}>
        Contact us
      </h2>

      <p className={styles.hpanelRequestSubtitle}>
        Find out how hosting your vehicle on MMMiles can help
        you earn more from your car.
      </p>

      

      <div className={styles.hpanelRequestGrid}>

        <div>
          <label>Name</label>
          <input type="text" />
        </div>

        <div>
          <label>Phone</label>
          <input type="text" />
        </div>

        <div>
          <label>Email Address</label>
          <input type="email" />
        </div>

        <div>
          <label>Location</label>

          <input type="place" />

        </div>

      </div>

      <div className={styles.hpanelRequestBottom}>

        <div className={styles.hpanelCheckboxArea}>

          <input
            type="checkbox"
            defaultChecked
          />

          <span>
            I would like to receive relevant updates from
            MMMiles.
          </span>

        </div>

        <button
          className={styles.hpanelRequestSubmit}
        >
          Submit
        </button>

      </div>

      <div className={styles.hpanelRequestFooter}>

        <h3>
          Our Team will Connect with You within 12 Hours
        </h3>

        

      </div>

    </div>

  </div>

)}


    </section>






{/* =========================
    HERO SECTION
========================= */}

<section className={styles.hpanelHeroSection}>

  <div className={styles.hpanelHeroCard}>

    {/* BG IMAGE */}

    <div className={styles.hpanelHeroBg}>

      {/* Desktop Image */}

      <Image
        src="/host-panel-car-desk.webp"
        alt="MM Miles Host Car"
        fill
        priority
        className={`${styles.hpanelHeroImage} ${styles.hpanelDesktopImage}`}
      />

      {/* Mobile Image */}

      <Image
        src="/host-panel-car-mobile.webp"
        alt="MM Miles Host Car Mobile"
        fill
        priority
        className={`${styles.hpanelHeroImage} ${styles.hpanelMobileImage}`}
      />

    </div>

    {/* OVERLAY */}

    <div className={styles.hpanelHeroOverlay}></div>

    {/* CONTENT */}

    <div className={styles.hpanelHeroContent}>

      <p className={styles.hpanelTopText}>
        Most platforms take 40%. only difference is <b>MMMiles.</b>
      </p>

      <h1 className={styles.hpanelMainHeading}>
        Same Car, Same City, Same Demand
      </h1>

      <p className={styles.hpanelSubText}>
        We cap commission upto <span>20%</span>
      </p>
      <button
        className={styles.hpanelHeroBtn}
        onClick={() => router.push("/host-registration-form")}
      >
        HOST TODAY
      </button>

    </div>

  </div>

</section>













      {/* =========================
          STATS SECTION
      ========================= */}

      <section
        className={styles.hpanelStatsSection}
        ref={statsRef}
      >

        <div className={styles.hpanelStatCard}>

          <h2>{counts.hosts}+</h2>

          <p>Happy Users</p>

        </div>

        <div className={styles.hpanelStatCard}>

          <h2>{counts.experience}+</h2>

          <p>Years of Experience</p>

        </div>

        <div className={styles.hpanelStatCard}>

          <h2>{counts.bookings}+</h2>

          <p>Booking per Month</p>

        </div>

      </section>










{/* =========================
    BENEFITS SECTION
========================= */}

<section className={styles.hpanelBenefitsSection}>
  <h2 className={styles.hpanelBenefitsHeading}>
    Why We’re the Right Choice
  </h2>
  <p className={styles.hpanelBenefitsHeadingp}>
    The smarter way to host cars with higher profit margins.
  </p>

  <div className={styles.hpanelBenefitsImageWrap}>

    {/* Desktop Image */}

    <Image
      src="/benefits-main-image.webp"
      alt="MM Miles Benefits"
      fill
      priority
      quality={100}
      sizes="100vw"
      className={`${styles.hpanelBenefitsImage} ${styles.hpanelBenefitsDesktop}`}
    />

    {/* Mobile Image */}

    <Image
      src="/benefits-main-image-mobile.webp"
      alt="MM Miles Benefits Mobile"
      fill
      priority
      quality={100}
      
      className={`${styles.hpanelBenefitsImage} ${styles.hpanelBenefitsMobile}`}
    />

  </div>

</section>









{/* =========================
    STEPS SECTION
========================= */}

<section className={styles.hpanelStepsSection}>
  <h2 className={styles.hpanelstepsHeading}>
    Still Confused?  Follow the easy steps start 
  </h2>
  <p className={styles.hpanelstepsHeadingp}>
    Confused About Hosting Your Car? Our Team Is Ready to Help.
  </p>

  <div className={styles.hpanelStepsImageWrap}>

  {/* Desktop Image */}

  <Image
    src="/hpanel-host.webp"
    alt="MM Miles Hosting Steps"
    fill
    priority
    quality={100}
    sizes="100vw"
    className={`${styles.hpanelStepsImage} ${styles.hpanelStepsDesktopImage}`}
  />

  {/* Mobile Image */}

  <Image
    src="/host-dash-mobile.webp"
    alt="MM Miles Hosting Steps Mobile"
    fill
    priority
    quality={100}
    sizes="100vw"
    className={`${styles.hpanelStepsImage} ${styles.hpanelStepsMobileImage}`}
  />

</div>

</section>










{/* =========================
    CTA SECTION
========================= */}

<section className={styles.hpanelCtaSection}>

  <div className={styles.hpanelCtaBg}></div>

  <div className={styles.hpanelCtaContent}>

    <h2>
      Don’t Let Your Car Sit Idle - Earn with It
    </h2>

    <p className={styles.hpanelCtaSubText}>
      Host Smart. Earn More. Trust MMMiles
    </p>

    <p className={styles.hpanelCtaDesc}>
      Host your car on our trusted platform, earn from verified
      users, receive secure payments within 7 days, and enjoy
      24/7 support whenever you need it.
    </p>

    <div className={styles.hpanelCtaButtons}>

      <button
        className={styles.hpanelOutlineBtn}
        onClick={() => setShowCallModal(true)}
      >
        REQUEST A CALL
      </button>

      <button
        className={styles.hpanelRegisterBtn}
        onClick={() => router.push("/host-registration-form")}
      >
        REGISTER NOW
      </button>

    </div>

  </div>

  {/* REQUEST CALL POPUP */}

  {showCallModal && (

  <div
    className={styles.hpanelModalOverlay}
    onClick={() => setShowCallModal(false)}
  >

    <div
      className={styles.hpanelRequestModal}
      onClick={(e) => e.stopPropagation()}
    >

      <button
        className={styles.hpanelModalClose}
        onClick={() => setShowCallModal(false)}
      >
        ✕
      </button>

      <h2 className={styles.hpanelRequestTitle}>
        Contact us
      </h2>

      <p className={styles.hpanelRequestSubtitle}>
        Find out how hosting your vehicle on MMMiles can help
        you earn more from your car.
      </p>

      

      <div className={styles.hpanelRequestGrid}>

        <div>
          <label>Name</label>
          <input type="text" />
        </div>

        <div>
          <label>Phone</label>
          <input type="text" />
        </div>

        <div>
          <label>Email Address</label>
          <input type="email" />
        </div>

        <div>
          <label>Location</label>

          <input type="place" />

        </div>

      </div>

      <div className={styles.hpanelRequestBottom}>

        <div className={styles.hpanelCheckboxArea}>

          <input
            type="checkbox"
            defaultChecked
          />

          <span>
            I would like to receive relevant updates from
            MMMiles.
          </span>

        </div>

        <button
          type="button"
          className={styles.hpanelRequestSubmit}
          onClick={() => {

            setShowCallModal(false);
            setShowSuccess(true);

            setTimeout(() => {
              setShowSuccess(false);
            }, 5000);

          }}
        >
          Submit
        </button>

      </div>

      <div className={styles.hpanelRequestFooter}>

        <h3>
          Our Team will Connect with You within 12 Hours
        </h3>

        

      </div>

    </div>

  </div>

)}

{showSuccess && (

  <div className={styles.hpanelSuccessOverlay}>

    <div className={styles.hpanelSuccessCard}>

      <div className={styles.hpanelSuccessIcon}>
        ✓
      </div>

      <h3>
        Your Call Request Submitted.
      </h3>

      <p>
        Thank you.
        Our team will contact you shortly.
      </p>

    </div>

  </div>

)}

</section>












 {/* =========================
    FEEDBACK SECTION
========================= */}

<section className={styles.hpanelFeedbackSection}>

  <div className={styles.hpanelFeedbackTop}>

    <h2 className={styles.hpanelFeedbackHeading}>
      Happy hosts. Proven results.
    </h2>

    <p className={styles.hpanelFeedbackHeadingp}>
      Take a minute. See the results. Become part of it.
    </p>

  </div>

  {/* SLIDER */}

  <div
    className={styles.hpanelFeedbackSlider}

    onTouchStart={(e) =>
      setTouchStart(e.targetTouches[0].clientX)
    }

    onTouchMove={(e) =>
      setTouchEnd(e.targetTouches[0].clientX)
    }

    onTouchEnd={() => {

      if (touchStart - touchEnd > 75) {

        setActiveIndex((prev) =>
          (prev + 1) % feedbacks.length
        );

      }

      if (touchStart - touchEnd < -75) {

        setActiveIndex((prev) =>
          (prev - 1 + feedbacks.length) % feedbacks.length
        );

      }

    }}
  >

    {feedbacks.map((item, index) => (

      <div
        key={index}

        onClick={() => setActiveIndex(index)}

        className={`${styles.hpanelFeedbackCardBase} ${getPosition(index)}`}
      >

        <div className={styles.hpanelFeedbackProfile}>

          <Image
            src={item.image}
            alt={item.name}
            width={78}
            height={78}
            className={styles.hpanelFeedbackAvatar}
          />

        </div>

        <h3 className={styles.hpanelFeedbackH3}>
          {item.name}
        </h3>

        <span className={styles.hpanelFeedbackRole}>
          {item.role}
        </span>

        <p className={styles.hpanelFeedbackPara}>
          {item.text}
        </p>

      </div>

    ))}

  </div>

  {/* DOTS */}

  <div className={styles.hpanelFeedbackDots}>

    {feedbacks.map((_, index) => (

      <button
        key={index}

        onClick={() => setActiveIndex(index)}

        className={`${styles.hpanelFeedbackDot} ${
          activeIndex === index
            ? styles.hpanelFeedbackDotActive
            : ""
        }`}
      />

    ))}

  </div>

</section>


    </div>
  );
}