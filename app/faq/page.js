"use client";
import React, { useState } from "react";
import styles from "./faq.module.css";

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {

      question: "What document do I need to rent a car?",

      answer:
        "You need a valid Driving License and a government-issued ID proof (Aadhar / Passport / PAN).",
    },
    {
      question: "What is the minimum age to rent a car?",
      answer: "The minimum age is 21 years.",
    },
    {
      question: "Do I need to pay a security deposit?",
      answer:
        "Yes. A refundable security deposit is required before the trip. It will be refunded after vehicle inspection (within 3–7 business days).",
    },
    {
      question: "How does fuel policy work?",
      answer:
        "Vehicles are provided with fuel, and you must return them with the same fuel level. Any shortage will be charged.",
    },
    {
      question: "Is there a kilometer limit?",
      answer:
        "Yes. Each rental includes a fixed km/day. Extra kilometers will be charged at the rate specified during booking.",
    },
    {
      question: "What happens if I return the car late?",
      answer: (
        <>
          <p>• Delay up to 4 hours → Hourly late fee applies.</p>
          <p>• Delay beyond 4 hours → Full-day rental charge applies.</p>
        </>
      ),
    },
    {
      question: "What if the car breaks down during my trip?",
      answer:
        "Call our 24x7 support team immediately. We will arrange roadside assistance or a replacement vehicle (subject to availability).",
    },
    {
      question: "Is insurance included?",
      answer:
        "Yes. All vehicles have standard motor insurance. However, damages due to negligence, speeding, or policy violations are renter’s responsibility.",
    },
    {
      question: "Can someone else drive the car I rented?",
      answer:
        "No. Only the registered renter (and any approved co-driver added at booking) can drive. Unauthorized drivers will void insurance and attract penalties.",
    },
    {
      question: "Can I cancel my booking?",
      answer: (
        <>
          <p>• Yes.</p>
          <p>• More than 24 hrs. before trip: 90% refund.</p>
          <p>• Within 24 hrs: 50% refund.</p>
          <p>• No-show: No refund.</p>
        </>
      ),
    },
    {
      question: "Can I take the car outside the city or state?",
      answer:
        "Yes, but only with prior approval from MM MILES. Interstate taxes, tolls, and permits are your responsibility.",
    },
    {
      question: "Are smoking or alcohol allowed in the car?",
      answer:
        "❌ Strictly prohibited. Cleaning charges or penalties will apply for violations.",
    },
    {
      question: "How do I book a car with MM MILES?",
      answer:
        "Simply share your travel dates and car preference on WhatsApp, and our team will confirm your booking.",
    },
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className={styles.faqSection}>
      <h1 className={styles.heading}>Frequently Asked Questions</h1>
      <p className={styles.subheading}>Know Before You Go</p>

      <div className={styles.faqContainer}>
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={index}
              className={`${styles.faqItem} ${isOpen ? styles.active : ""}`}
            >
              <button
                className={styles.faqQuestion}
                onClick={() => toggleFAQ(index)}
              >
                <span>{faq.question}</span>
                <span
                  className={`${styles.arrow} ${isOpen ? styles.rotate : ""}`}
                >
                  ▼
                </span>
              </button>

              <div
                className={`${styles.faqAnswer} ${
                  isOpen ? styles.showAnswer : ""
                }`}
              >
                {typeof faq.answer === "string" ? <p>{faq.answer}</p> : faq.answer}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
