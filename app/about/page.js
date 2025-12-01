import React from "react";
import Image from "next/image";
import "./about.css";

export default function Hero() {
  return (
    <div className="hero">
      {/* ===== Banner ===== */}
      <section className="hero">
        <div className="hero-fit">
          <Image
            src="/about-hero-final.jpg"
            alt="Top View Car"
            width={1920}
            height={1080}
            style={{ objectFit: "cover", width: "100%", height: "auto" }}
        priority
          />
        </div>
      </section>

      {/* ===== About Us ===== */}
      <section className="about-section">
        <h2>About Us</h2>
        <p>
          At MM Miles, we make car rentals simple, affordable, and convenient.
          From luxury cars to budget-friendly rides, we ensure you get the best
          driving experience. we see every trip as more than just reaching a destination—it’s about giving you the freedom, confidence, and convenience to drive your way.
          Our journey began with a simple vision—to redefine the car rental experience by making it more than just a transaction. We saw the challenges travelers faced with limited options, hidden costs, and complicated bookings, and set out to create a service that was transparent, reliable, and truly customer-first.
        </p>
        
      </section>

      {/* ===== Team ===== */}
      <section className="team-section">
        <div className="team-member">
          <Image src="/images/ko2.jpg" alt="Team Member" width={120} height={120} className="team-img"/>
          <h4>John</h4>
          <p>Founder</p>
        </div>
        <div className="team-member">
          <Image src="/images/ko2.jpg" alt="Team Member" width={120} height={120} className="team-img"/>
          <h4>Katherine</h4>
          <p>Co-Founder</p>
        </div>
      </section>

      {/* ===== Vision & Mission ===== */}
      <section className="vision-mission-section">
  <div className="card">
    <img src="/images/vision.png" alt="Vision Icon" className="card-icon" />
    <h3>Our Vision</h3>
    <p> A future where self-drive means total freedom and comfort.
     To set the gold standard for premium car rentals worldwide. Setting new benchmarks in reliability, efficiency, and  customer satisfaction.</p>
  </div>

    <div className="card">
    <img src="/images/mission.png" alt="Mission Icon" className="card-icon" />
    <h3>Our Mission</h3>
    <p>To provide travelers with the freedom to explore, in cars that inspire confidence and class. We empower every customer with
    the keys to comfort, control, and unforgettable journeys, creating a legacy of road trips and memories. </p> 
    
    </div>
    </section>

    {/* ===== UNSDG Goals Section ===== */}
      <section className="unsdg">
        <div className="unsdg-header">
          
          <p className="unsdg-subtext">
            Every ignition sparks a movement - towards smarter drives and cleaner skies.
          </p>
          <p className="unsdg-subtext">
            Because every green mile counts - and every journey matters.
          </p>
          <p className="unsdg-subtext">
            MM Miles stands as a name built on trust, travel, and transformation.
          </p>
        </div>

        <div className="unsdg-content">
          <h1>Our commitment to UNSDG Goals</h1>
          <div className="unsdg-strip">
            <Image
              src="/images/unsdg1.gif"
              alt="UNSDG Goals"
              width={840}
              height={200}
              className="unsdg-img"
            />
          </div>

          
        </div>

        <div className="unsdg-description">
          <p>
            Seven years ago, a dream rolled out onto the streets of <b>Chennai.</b>
            It wasn’t about cars — it was about freedom, comfort, and trust.
            Every journey, every smile, every return — built the road called <b> MM Miles</b>.
            Today, we don’t just rent cars…
            We move people, memories, and moments.
            <b> MM Miles</b> — Seven years of driving Chennai’s dreams.
          </p>
        </div>

      {/* ===== Stats Section ===== */}
        <div className="stats">
          <div className="stat">
            <h4>5000+</h4>
            <p>journeys of trust</p>
          </div>
          <div className="stat">
            <h4>15k+</h4>
            <p>Kilo-meters in a Month</p>
          </div>
          <div className="stat" id="stat">
            <h4>24/7</h4>
            <p>We’re just a call away</p>
          </div>
        </div>
      </section>
    </div>
  );
}