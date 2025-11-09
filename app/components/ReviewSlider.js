"use client";
import Image from "next/image";
import styles from "./ReviewSlider.module.css";

const reviews = [
  {
    text: "The booking was super easy, got a clean, comfortable car for our girls’ weekend. Having GPS and Bluetooth made the trip stress-free and fun.",
    name: "Priya S.",
    title: "Friends Trip (4 members)",
    img: "/profile1.jpg",
  },
  {
    text: "MM Miles made our family road trip smooth from start to finish. The spacious SUV fit all our luggage, and the customer support was always available.",
    name: "Rohan K.",
    title: "Family (5 members)",
    img: "/profile2.jpg",
  },
  {
    text: "Our car broke down suddenly, but I got a replacement vehicle within an hour. Fast response and professional team — truly a lifesaver.",
    name: "Sneha L.",
    title: "Emergency Booking",
    img: "/profile3.jpg",
  },
  {
    text: "Even during the holiday rush, MM Miles had cars ready on short notice. We appreciated how easy it was to pick up and drop off without delays.",
    name: "Arjun P.",
    title: "Frequent Traveler",
    img: "/profile4.jpg",
  },
   {
    text: "I often rent for work trips, and MM Miles is the most reliable. The process is seamless and the cars are always in excellent condition.",
    name: "Kavita D.",
    title: "Corporate Client",
    img: "/profile1.jpg",
  },
   {
    text: "Got stuck in the rain with no transport, and MM Miles helped me get a car. Smooth pickup and great service even in bad weather.",
    name: "Neha V.",
    title: "Daily Commuter",
    img: "/profile2.jpg",
  },
  {
    text: "Needed a car to pick up family from the airport. Booking took just 2 minutes, and the car was ready right on time. Excellent coordination!",
    name: "Harish T.",
    title: "Local Resident",
    img: "/profile3.jpg",
  },
  {
    text: "Drove from Bangalore to Goa using MM Miles. The car handled beautifully the entire way, and there were no hidden charges at all.",
    name: "Deepa S.",
    title: "Road Trip Traveler",
    img: "/profile4.jpg",
  },
  {
    text: "Our company car went for servicing, and MM Miles provided an immediate replacement. Flexible plans and professional support.",
    name: "Rajesh K.",
    title: "Fleet Manager",
    img: "/profile1.jpg",
  },
  {
    text: "I Booked just an hour before my trip and still got a clean, reliable vehicle. I'm super impressed with MM miles a quick turn around and its response.",
    name: "Ananya D.",
    title: "Solo Traveler",
    img: "/profile2.jpg",
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


