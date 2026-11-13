import Image from "next/image";
import { Quote } from "lucide-react";
import ui from "./ui.module.css";
import styles from "./Testimonials.module.css";

const GOOGLE_REVIEW_URL = "https://g.page/r/Cf04Wx5P5v3vEAE/review";

// Customer quotes (from the site's existing testimonials), with face-cropped photos in /landing/people
const REVIEWS = [
  {
    name: "Vishal",
    context: "Needed urgent help",
    photo: "vishal",
    text: "Our car broke down suddenly, but I got a replacement vehicle within an hour. Fast response and professional team — truly a lifesaver.",
  },
  {
    name: "Vengat",
    context: "Family road trip",
    photo: "vengat",
    text: "MM Miles made our family road trip smooth from start to finish. The spacious SUV fit all our luggage, and the customer support was 24/7.",
  },
  {
    name: "Bhavya P",
    context: "Airport pickup",
    photo: "bhavya",
    text: "Needed a car to pick up family from the airport. Booking took just 2 minutes, and the car was ready right on time. Excellent coordination!",
  },
  {
    name: "Fazil",
    context: "Friends' trip, 4 people",
    photo: "fazil",
    text: "The booking was super easy, got a clean, comfortable car for our boys' weekend. Having 24/7 support made the trip stress-free and fun.",
  },
  {
    name: "Ganesh",
    context: "Corporate client",
    photo: "ganesh",
    text: "I often rent for work trips, and MM Miles is the most reliable. The process is seamless and the cars are always in excellent condition.",
  },
  {
    name: "Shivraj",
    context: "Solo traveller",
    photo: "shivraj",
    text: "I booked just a day before my trip and I still got a reliable vehicle. I'm super impressed with MM Miles' quick turnaround and response.",
  },
];

export default function Testimonials() {
  return (
    <section className={`${ui.section} ${styles.section}`} aria-labelledby="reviews-title">
      <div className={ui.container}>
        <div className={ui.headRow}>
          <div className={ui.head}>
            <p className={ui.eyebrow}>Reviews</p>
            <h2 id="reviews-title" className={ui.title}>
              Loved by people who drive with us
            </h2>
          </div>
          <a href={GOOGLE_REVIEW_URL} target="_blank" rel="noopener noreferrer" className={ui.textLink}>
            Write a review on Google
          </a>
        </div>

        <ul className={styles.grid}>
          {REVIEWS.map((r, i) => (
            <li key={r.name} className={`${styles.card} ${i === 0 ? styles.featured : ""}`}>
              <Quote size={28} className={styles.quoteIcon} aria-hidden="true" />
              <blockquote className={styles.text}>{r.text}</blockquote>
              <div className={styles.person}>
                <Image src={`/landing/people/${r.photo}.webp`} alt="" width={48} height={48} className={styles.avatar} />
                <div>
                  <p className={styles.name}>{r.name}</p>
                  <p className={styles.context}>{r.context}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
