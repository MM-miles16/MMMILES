"use client";
import { useEffect } from "react";
import Image from "next/image";
import "./reviews.css";

export default function ReviewsPage() {
  const reviews = [
    {
      id: 1,
      name: "Rohan K.",
      role: "Family Trip",
      text: `MM Miles made our family trip smooth and stress-free.
The SUV was spotless, spacious, and super comfortable.
Customer support was always available when needed.
Truly the best family travel experience we’ve had.`,
      image: "/profile1.jpg",
    },
    {
      id: 2,
      name: "Sneha L.",
      role: "Emergency Booking",
      text: `My car broke down suddenly but MM Miles saved the day.
A replacement arrived within an hour of booking.
Their polite, professional staff made it effortless.
Fast, reliable, and truly dependable service.`,
      image: "/profile2.jpg",
    },
    {
      id: 3,
      name: "Arjun P.",
      role: "Frequent Traveler",
      text: `Even during peak holiday rush, cars were on time.
Pickup and drop were smooth without any waiting.
Every vehicle I rent feels fresh and well-maintained.
MM Miles always ensures a premium experience and excellence.`,
      image: "/profile3.jpg",
    },
    {
      id: 4,
      name: "Kavita D.",
      role: "Corporate Client",
      text: `I rent cars from MM Miles for work trips often and MM Miles never fails.
Booking and delivery are seamless every single time.
The cars are spotless, reliable, and stylish too.
Perfect for clients who expect professionalism.`,
      image: "/profile4.jpg",
    },
     {
      id: 5,
      name: "Rahul S.",
      role: "Weekend Getaway",
      text: `Rented a car for a short weekend escape out of town.
It was clean, perfectly maintained, and fuel-efficient.
Pickup was quick, return even faster with no hassle.
MM Miles made travel feel effortless and fun.`,
      image: "/profile1.jpg",
    },
    {
      id: 6,
      name: "Priya N.",
      role: "Corporate Event",
      text: `We hired cars from MM Miles for a company event in Bangalore.
All vehicles arrived early and spotless inside out.
Drivers were polite and well-dressed professionals.
A flawless execution from start to finish.`,
      image: "/profile2.jpg",
    },
    {
      id: 7,
      name: "Vikram T.",
      role: "Monthly Renter",
      text: `I’ve been using MM Miles for long-term car rentals.
Renewals and payments are smooth and well managed.
Cars always arrive freshly detailed and maintained.
They make recurring rentals completely stress-free.`,
      image: "/profile3.jpg",
    },
    {
      id: 8,
      name: "Meera J.",
      role: "Leisure Traveler",
      text: `We toured South India using MM Miles premium SUV.
The ride was smooth even on long scenic stretches.
Their support team checked in midway to ensure comfort.
It truly felt like traveling with complete peace of mind.`,
      image: "/profile4.jpg",
    },
    {
      id: 9,
      name: "Aditya P.",
      role: "College Trip",
      text: `Booked a compact car for our weekend college road trip.
Affordable pricing with excellent vehicle condition.
Pickup and return were seamless, quick, and easy.
A premium experience even for a student budget.`,
      image: "/profile1.jpg",
    },
    {
      id: 10,
      name: "Neha R.",
      role: "Airport Pickup",
      text: `Booked a 5 AM airport transfer and the car arrived early.
Driver was courteous and drove safely the whole way.
Clean interiors and fresh fragrance made it pleasant.
MM Miles has become my go-to for every trip.`,
      image: "/profile2.jpg",
    },
    {
      id: 11,
      name: "Suresh M.",
      role: "Luxury Ride",
      text: `Hired a luxury sedan for my anniversary celebration.
The car arrived shining, elegant, and with a sweet note.
Every tiny detail reflected class and professionalism.
A perfect blend of style, comfort, and reliability.`,
      image: "/profile3.jpg",
    },
    {
      id: 12,
      name: "Ananya B.",
      role: "Long-Term Lease",
      text: `Opted cars from MM Miles long-term lease for work travel.
Monthly renewals are effortless with zero downtime.
Car swaps are instant, clean, and well organized.
Truly dependable and premium in every sense.`,
      image: "/profile4.jpg",
    },
  ];

  useEffect(() => {
    const cards = document.querySelectorAll(".testimonialCard");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, index) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              entry.target.classList.add("show");
            }, index * 150);
          }
        });
      },
      { threshold: 0.2 }
    );
    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, []);

  return (
    <section className="testimonialSection">
      <div className="testimonialHeader">
        <h2 className="testimonialHeading">Customer Reviews</h2>
        <p className="testimonialSub">
          Here&apos;s what our happy customers say about us!
        </p>
      </div>

      <div className="testimonialGrid">
        {reviews.map((review) => (
          <div className="testimonialCard" key={review.id}>
            <p className="testimonialText">{review.text}</p>
            <div className="testimonialProfile">
              <Image
                src={review.image}
                alt={review.name}
                width={50}
                height={50}
                className="profileImage"
              />
              <div>
                <h4 className="profileName">{review.name}</h4>
                <p className="profileRole">{review.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
