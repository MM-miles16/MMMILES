"use client";

import styles from "./guide.module.css";
import Image from "next/image";
import { motion } from "framer-motion";

export default function GuidePage() {
  const steps = [
    {
      id: 1,
      title: "Book in Advance",
      desc: "Rates usually increase closer to your trip date. Booking in advance lets you save more, and you can modify or cancel for free up to 48 hours before pickup.",
      img: "/Group 307.png",
      bg: "#d2dde6ff",
    },
    {
      id: 2,
      title: "Pay Attention to Reviews",
      desc: "Explore authentic customer reviews to evaluate service quality. Opting for top-rated providers ensures a smooth and reliable rental experience",
      img: "/gauid2.jpg",
      bg: "#e2dfd2ff",
    },
    {
      id: 3,
      title: "Fuel Policy Reminder",
      desc: "Ensure the car is returned with the agreed fuel level to avoid extra costs. Reviewing the rental details in advance clarifies what’s required at pickup and drop-off.",
      img: "/gauid3.jpg",
      bg: "#e4deb6ff",
    },
    {
      id: 4,
      title: "Fuel Expense Guide",
      desc: "Enjoy a hassle-free rental with zero upfront deposits and no security amount blocked or charged. Pay only for what you use and keep your funds available.",
      img: "/gauid1.jpg",
      bg: "#f3e9ddff",
    },
  ];

  return (
    <motion.div
      className={styles.gcontainer}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <motion.h1
        className={styles.gtitle}
        initial={{ y: 25, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        How to find a Great Car Rental Deal
      </motion.h1>

      <motion.p
        className={styles.gsubtitle}
        initial={{ y: 25, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        We find the best price. Here’s how to get the best deal:
      </motion.p>

      <div className={styles.ggrid}>
        {steps.map((item, i) => (
          <motion.div
            key={item.id}
            className={styles.gcard}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.2, duration: 0.6 }}
            whileHover={{ scale: 1.04 }}
          >
            <div className={styles.gimageBox} style={{ background: item.bg }}>
              <Image src={item.img} alt={item.title} width={180} height={180} />
            </div>

            <h3>{item.title}</h3>
            <p>{item.desc}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}