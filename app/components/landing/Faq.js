import { Phone, Plus } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import ui from "./ui.module.css";
import styles from "./Faq.module.css";

// Native <details> accordion: works without JS and stays fully crawlable.
// `faqs` is the same list the page uses for its FAQPage schema.
export default function Faq({ faqs }) {
  return (
    <section className={ui.section} aria-labelledby="faq-title">
      <div className={`${ui.container} ${styles.layout}`}>
        <div className={styles.intro}>
          <p className={ui.eyebrow}>FAQs</p>
          <h2 id="faq-title" className={ui.title}>
            Questions, answered
          </h2>
          <p className={ui.lead}>Still unsure about something? Talk to a real person, any time.</p>
          <div className={styles.actions}>
            <a href="https://wa.me/918050953607" target="_blank" rel="noopener noreferrer" className={`${ui.btn} ${ui.btnDark}`}>
              <FaWhatsapp size={18} aria-hidden="true" /> WhatsApp us
            </a>
            <a href="tel:+918050953607" className={`${ui.btn} ${styles.btnSoft}`}>
              <Phone size={17} aria-hidden="true" /> Call
            </a>
          </div>
        </div>

        <div className={styles.list}>
          {faqs.map((f, i) => (
            <details key={f.q} className={styles.item} open={i === 0}>
              <summary className={styles.question}>
                {f.q}
                <span className={styles.icon} aria-hidden="true">
                  <Plus size={18} strokeWidth={2.2} />
                </span>
              </summary>
              <p className={styles.answer}>{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
