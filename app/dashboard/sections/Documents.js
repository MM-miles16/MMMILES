"use client";
// Documents: the driving licence and Aadhaar as two ID cards. Before verification they are empty
// outlines with a clear "Verify with DigiLocker" step; once DigiLocker shares them they fill in
// (masked numbers, name on record) and are read-only. Help with common DigiLocker problems, chat and
// email support sit below while anything is unverified, and stay one tap away afterwards.
import { useRef } from "react";
import Image from "next/image";
import { BadgeCheck, ChevronDown, CircleAlert, CircleCheck, Clock3, EyeOff, FileBadge, Fingerprint, LifeBuoy, Lock, Mail, MessageCircle, RefreshCw, ShieldCheck } from "lucide-react";
import { day, Head, LoadError, SkeletonRows, useApi } from "../shared";
import styles from "../dashboard.module.css";

const START = "/api/auth/digilocker?for=renter";
const SUPPORT_EMAIL = "support@mmmiles.com";

// "TN05XXXXXXX4321" → "TN05 XXXXXXX 4321" (Aadhaar already arrives as "XXXX XXXX 1234")
const spaced = (n) => (n && !/\s/.test(n) && n.length > 8 ? `${n.slice(0, 4)} ${n.slice(4, -4)} ${n.slice(-4)}` : n);

const FIXES = [
  {
    q: "My driving licence isn't in DigiLocker",
    a: "Open the DigiLocker app or website, choose Search documents, pick Ministry of Road Transport and Highways, then Driving License, and add it with your licence number. Then come back here and verify again.",
  },
  {
    q: "I don't get the OTP from DigiLocker",
    a: "DigiLocker sends the OTP to the mobile number linked to your Aadhaar. If that number has changed, it needs updating at an Aadhaar centre first. Until then, message us and we'll help you finish your booking.",
  },
  {
    q: "I came back but my cards are still empty",
    a: "In DigiLocker, tap Allow for both your driving licence and Aadhaar, then try again. If the cards still don't fill in, send us a message and we'll check it for you.",
  },
];

// An empty line on an unverified card
const Slot = ({ width }) => (
  <>
    <span className={styles.slot} style={{ width }} aria-hidden="true" />
    <span className={styles.srOnly}>Not added yet</span>
  </>
);

function DocCard({ kind, verified, number, name, verifiedAt }) {
  const licence = kind === "licence";
  const Icon = licence ? FileBadge : Fingerprint;
  const title = licence ? "Driving licence" : "Aadhaar";
  return (
    <article className={`${styles.idDoc} ${verified ? (licence ? styles.idDocDl : styles.idDocAa) : styles.idDocEmpty}`} aria-label={`${title}, ${verified ? "verified" : "not verified yet"}`}>
      <div className={styles.idDocTop}>
        <span className={styles.idDocIcon} aria-hidden="true">
          <Icon size={20} strokeWidth={1.9} />
        </span>
        <span className={styles.idDocKind}>
          <span className={styles.idDocTitle}>{title}</span>
          <span className={styles.idDocSub}>{licence ? "Needed to book a self-drive car" : "Confirms your identity"}</span>
        </span>
        <span className={styles.idDocChip}>
          {verified ? (
            <>
              <BadgeCheck size={14} strokeWidth={2.2} aria-hidden="true" />
              Verified
            </>
          ) : (
            "Not verified"
          )}
        </span>
      </div>

      <dl className={styles.idDocFacts}>
        <div>
          <dt>{licence ? "Licence number" : "Aadhaar number"}</dt>
          <dd className={styles.idDocNumber}>{verified ? (number ? spaced(number) : "Verified through DigiLocker") : <Slot width="74%" />}</dd>
        </div>
        <div>
          <dt>Name on record</dt>
          <dd>{verified ? name || "As on DigiLocker" : <Slot width="46%" />}</dd>
        </div>
      </dl>

      <div className={styles.idDocFoot}>
        {verified ? (
          <>
            <Lock size={13} strokeWidth={2.2} aria-hidden="true" />
            <span>From DigiLocker, can&apos;t be edited</span>
            {verifiedAt && <span className={styles.idDocDate}>{day(verifiedAt)}</span>}
          </>
        ) : (
          <>
            <Clock3 size={13} strokeWidth={2.2} aria-hidden="true" />
            <span>Fills in automatically after you verify</span>
          </>
        )}
      </div>
    </article>
  );
}

function Help({ open, helpRef, verified }) {
  const openChat = () => window.dispatchEvent(new Event("open-chat"));
  const mail = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(verified ? "My document details" : "Help with document verification")}&body=${encodeURIComponent(
    verified ? "Hi MM Miles team,\n\nSomething on my Documents page doesn't look right:\n\n" : "Hi MM Miles team,\n\nI couldn't verify my documents with DigiLocker. What happened:\n\n"
  )}`;
  return (
    <section ref={helpRef} id="doc-help" className={styles.docHelp} aria-labelledby="doc-help-title" tabIndex={-1}>
      <div className={styles.docHelpHead}>
        <span className={styles.docHelpIcon} aria-hidden="true">
          <LifeBuoy size={22} strokeWidth={1.9} />
        </span>
        <div>
          <h2 id="doc-help-title" className={styles.docHelpTitle}>
            {verified ? "Details don't look right?" : "Trouble verifying?"}
          </h2>
          <p className={styles.docHelpLead}>
            {verified
              ? "Details from DigiLocker can't be edited here. Tell us what's wrong and we'll sort it out."
              : "Most problems have a quick fix. If yours doesn't, we're here to help."}
          </p>
        </div>
      </div>

      {!verified && (
        <div className={styles.fixes}>
          {FIXES.map((f, i) => (
            <details key={f.q} className={styles.fix} open={open && i === 0}>
              <summary>
                {f.q}
                <ChevronDown size={18} strokeWidth={2} aria-hidden="true" />
              </summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      )}

      <div className={styles.docHelpActions}>
        <button type="button" className={`${styles.btn} ${styles.btnDark}`} onClick={openChat}>
          <MessageCircle size={16} strokeWidth={2} aria-hidden="true" />
          Chat with us
        </button>
        <a className={`${styles.btn} ${styles.btnLine}`} href={mail}>
          <Mail size={16} strokeWidth={2} aria-hidden="true" />
          Email support
        </a>
        <span className={styles.docHelpNote}>
          <Clock3 size={14} strokeWidth={2} aria-hidden="true" />
          We reply within 12 hours
        </span>
      </div>
    </section>
  );
}

export default function Documents({ onBack, callback, onClearCallback }) {
  const api = useApi("/api/dashboard/kyc");
  const helpRef = useRef(null);
  const d = api.data || {};
  const licence = d.licence || {};
  const aadhaar = d.aadhaar || {};
  const ready = api.status === "ready";
  const setup = api.status === "setup"; // verification table not created yet: DigiLocker can't save, so treat it as unavailable
  const shown = ready || setup;
  const allDone = ready && licence.verified && aadhaar.verified;
  const someDone = ready && (licence.verified || aadhaar.verified);
  const unavailable = setup || (ready && d.available === false);
  const failed = callback?.status === "failed";

  const toHelp = () => {
    helpRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    helpRef.current?.focus({ preventScroll: true });
  };

  let title = "Verify your documents";
  let lead = "It takes about a minute with DigiLocker, the Government of India's document wallet. Your cards below fill in on their own.";
  if (allDone) {
    title = "You're verified";
    lead = `Verified as ${d.name || "you"}${d.verifiedAt ? ` on ${day(d.verifiedAt)}` : ""}. You're all set to book.`;
  } else if (someDone) {
    title = "One more step";
    lead = `DigiLocker shared your ${licence.verified ? "driving licence" : "Aadhaar"} but not your ${licence.verified ? "Aadhaar" : "driving licence"}. Verify again and allow access to both.`;
  }

  return (
    <section aria-labelledby="dash-title">
      <Head title="Documents" lead="Your driving licence and Aadhaar, verified once through DigiLocker." onBack={onBack} />

      {callback?.status === "success" && (
        <div className={`${styles.banner} ${styles.bannerOk}`} role="status">
          <CircleCheck size={20} strokeWidth={2} aria-hidden="true" />
          <span>DigiLocker verification complete. Your cards are updated below.</span>
          <button type="button" className={styles.bannerClose} onClick={onClearCallback} aria-label="Dismiss">
            ×
          </button>
        </div>
      )}
      {failed && (
        <div className={`${styles.banner} ${styles.bannerBad}`} role="alert">
          <CircleAlert size={20} strokeWidth={2} aria-hidden="true" />
          <span>{callback.error || "Verification didn't finish. Please try again."}</span>
          <button type="button" className={styles.bannerLink} onClick={toHelp}>
            Get help
          </button>
          <button type="button" className={styles.bannerClose} onClick={onClearCallback} aria-label="Dismiss">
            ×
          </button>
        </div>
      )}

      {api.status === "loading" && <SkeletonRows count={2} height={160} />}
      {api.status === "error" && <LoadError onRetry={api.reload} />}
      {shown && (
        <div className={`${styles.digi} ${allDone ? styles.digiDone : ""}`}>
          <span className={styles.digiLogo}>
            <Image src="/digilocker.webp" alt="DigiLocker" width={52} height={52} />
          </span>
          <div className={styles.digiText}>
            <h2 className={styles.digiTitle}>{title}</h2>
            <p className={styles.digiLead}>{lead}</p>
          </div>
          {unavailable ? (
            <span className={styles.digiNote}>DigiLocker is temporarily unavailable. Please try again later, or ask us for help below.</span>
          ) : (
            <a href={START} className={`${styles.btn} ${allDone ? styles.btnLine : styles.btnDark}`}>
              {someDone ? <RefreshCw size={16} strokeWidth={2} aria-hidden="true" /> : <BadgeCheck size={17} strokeWidth={2} aria-hidden="true" />}
              {someDone ? "Verify again" : "Verify with DigiLocker"}
            </a>
          )}
          {!someDone && !unavailable && (
            <ol className={styles.digiSteps}>
              <li>
                <b>1</b>Sign in to DigiLocker
              </li>
              <li>
                <b>2</b>Allow your licence and Aadhaar
              </li>
              <li>
                <b>3</b>Come back here, all done
              </li>
            </ol>
          )}
        </div>
      )}

      {shown && (
        <>
          <div className={styles.idDocs}>
            <DocCard kind="licence" verified={licence.verified} number={licence.number} name={d.name} verifiedAt={d.verifiedAt} />
            <DocCard kind="aadhaar" verified={aadhaar.verified} number={aadhaar.number} name={d.name} verifiedAt={d.verifiedAt} />
          </div>

          <ul className={styles.privacy}>
            <li>
              <ShieldCheck size={16} strokeWidth={2} aria-hidden="true" />
              Only what you see on these cards is saved
            </li>
            <li>
              <EyeOff size={16} strokeWidth={2} aria-hidden="true" />
              Numbers are partly hidden. We never store your full Aadhaar number.
            </li>
            <li>
              <RefreshCw size={16} strokeWidth={2} aria-hidden="true" />
              Renewed your licence? Verify again to update it.
            </li>
          </ul>

          <Help open={failed} helpRef={helpRef} verified={allDone} />
        </>
      )}
    </section>
  );
}
