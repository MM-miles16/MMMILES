import { Plus } from "lucide-react";
import ui from "./ui.module.css";
import styles from "./Faq.module.css";

// The questions people search most before renting (see getHomeFaqs). Native <details> accordion:
// works without JS and stays crawlable. `faqs` is the same list the page uses for its FAQPage schema.
// All questions start closed; answers are kept to about two lines. Laptops and up: two columns.
// Phones: one grouped, app-style list.
export default function Faq({ faqs }) {
  const half = Math.ceil(faqs.length / 2);
  const columns = [faqs.slice(0, half), faqs.slice(half)];

  return (
    <section className={`${ui.section} ${styles.section}`} aria-labelledby="faq-title">
      <div className={ui.container}>
        <div className={`${ui.head} ${styles.head}`}>
          <p className={ui.eyebrow}>FAQs</p>
          <h2 id="faq-title" className={ui.title}>
            Questions renters ask most
          </h2>
          <p className={ui.lead}>Straight answers to what people search before booking a self-drive car.</p>
        </div>

        <div className={styles.grid}>
          {columns.map((column, c) => (
            <div key={c} className={styles.column}>
              {column.map((f) => (
                <details key={f.q} className={styles.item}>
                  <summary className={styles.question}>
                    <span>{f.q}</span>
                    <span className={styles.icon} aria-hidden="true">
                      <Plus size={16} strokeWidth={2.4} />
                    </span>
                  </summary>
                  <p className={styles.answer}>{f.a}</p>
                </details>
              ))}
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
