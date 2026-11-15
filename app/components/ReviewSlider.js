"use client";
import Image from "next/image";
import styles from "./ReviewSlider.module.css";

const reviews = [
  {
    text: "The booking was super easy, got a clean, comfortable car for our Boy’s weekend. Having 24/7 support made the trip stress-free and fun.",
    name: "Fazil",
    title: "Friends Trip (4 members)",
    img: "/Fazil.jpeg",
  },
  {
    text: "MM Miles made our family road trip smooth from start to finish. The spacious SUV fit all our luggage, and the customer support was 24/7.",
    name: "Vengat",
    title: "Weekend Gateway",
    img: "/vengat.jpeg",
  },
  {
    text: "Our car broke down suddenly, but I got a replacement vehicle within an hour. Fast response and professional team — truly a lifesaver.",
    name: "Vishal",
    title: "Immediete Support",
    img: "/vishal.jpeg",
  },
  {
    text: "Even during the holiday rush, MM Miles had cars ready on short notice. We appreciated how easy it was to pick up and drop off without delays.",
    name: "Dayan Khan",
    title: "Frequent Traveler",
    img: "/dayan khan.jpeg",
  },
   {
    text: "I often rent for work trips, and MM Miles is the most reliable. The process is seamless and the cars are always in excellent condition.",
    name: "Ganesh",
    title: "Corporate Client",
    img: "/ganesh.jpeg",
  },
   {
    text: "I got stuck in the rain with no transport, and MM Miles helped me to get a car. Smooth pickup and great service even in a bad weather.",
    name: "Dinesh",
    title: "Daily Commuter",
    img: "/dinesh.jpeg",
  },
  {
    text: "I had drove from Chennai to Bangalore using MM Miles. The car was handled in a good manner, and there were no hidden charges.",
    name: "Raksha",
    title: "Road Trip Traveler",
    img: "/tutu.jpg",
  },
  {
    text: "I Booked just an day before my trip and I still got a reliable vehicle. I'm super impressed with MM miles a quick turn around and its response.",
    name: "Shivraj",
    title: "Solo Traveler",
    img: "/shivu.jpg",
  },
];

export default function ReviewSlider() {
  return (
    <div className={styles.reviewslide}>
      <section
        className={styles.reviewSection}
        aria-label="Customer testimonials"
      >
        <h2 className={styles.heading}>People are talking</h2>
        <div className={styles.slider}>
          <div className={styles.sliderTrack}>
            {[...reviews, ...reviews, ...reviews].map((review, idx) => (
              <div className={styles.card} key={idx}>
                <p className={styles.text}>{review.text}</p>
                <div className={styles.profile}>
                  <Image
                    src={review.img}
                    alt={review.name}
                    width={40}
                    height={40}
                    className={styles.avatar}
                  />
                  <div>
                    <strong>{review.name}</strong>
                    <p className={styles.title}>{review.title}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}