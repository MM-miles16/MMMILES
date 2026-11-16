"use client";
// Profile: who you are (initials, name, phone, edit), a nudge when checkout details are missing,
// your licence verification status, trip counts, and your details. Edit opens a sheet; saving
// updates the customers row (or creates it). The phone number is never sent.
import { useEffect, useRef, useState } from "react";
import { BadgeCheck, ChevronRight, CircleAlert, CircleCheck, Lock, Mail, MapPin, Pencil, Phone, ShieldCheck, UserRound, Users } from "lucide-react";
import { toast } from "react-hot-toast";
import { makeAuthenticatedRequest } from "../../../lib/customSupabaseClient";
import { Head, initials, readToken, Sheet } from "../shared";
import styles from "../dashboard.module.css";

const GENDERS = ["Male", "Female", "Other"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Profile({ profile, name, counts, tripsReady, kyc, onBack, go, onRetry, onSaved }) {
  const [editing, setEditing] = useState(false);
  const d = profile.data || {};
  const loading = profile.status === "loading";
  const missing = profile.status === "ready" && (!d.first_name || !d.last_name || !d.email || !d.address);
  const licenceVerified = kyc?.licence?.verified;
  const rows = [
    { Icon: UserRound, label: "Full name", value: name },
    { Icon: Mail, label: "Email", value: d.email },
    { Icon: Phone, label: "Phone", value: profile.phone, locked: true },
    { Icon: Users, label: "Gender", value: d.gender },
    { Icon: MapPin, label: "Address", value: d.address },
  ];
  const stats = [
    { key: "all", label: "Total trips", value: counts.all },
    { key: "upcoming", label: "Upcoming", value: counts.upcoming },
    { key: "completed", label: "Completed", value: counts.completed },
  ];

  return (
    <section aria-labelledby="dash-title">
      <Head title="Profile" lead="Your details for bookings and receipts." onBack={onBack} />

      {profile.status === "error" && (
        <div className={styles.notice} role="alert">
          <span>We couldn&apos;t load your profile.</span>
          <button type="button" className={`${styles.btnSm} ${styles.btnLine}`} onClick={onRetry}>
            Try again
          </button>
        </div>
      )}

      <div className={styles.profileCard}>
        <span className={`${styles.avatar} ${styles.avatarLg}`} aria-hidden="true">
          {initials(d.first_name, d.last_name) || <UserRound size={28} strokeWidth={2} />}
        </span>
        <div className={styles.profileText}>
          <h2 className={styles.profileName}>{loading ? <span className={`${styles.skelLine} ${styles.shimmer}`} style={{ width: 160 }} /> : name || "Add your name"}</h2>
          <span className={styles.profilePhone}>{profile.phone || " "}</span>
        </div>
        <button type="button" className={`${styles.btn} ${styles.btnLine}`} onClick={() => setEditing(true)} disabled={loading}>
          <Pencil size={16} strokeWidth={2} aria-hidden="true" />
          Edit profile
        </button>
      </div>

      {missing && (
        <div className={styles.nudge}>
          <span className={styles.nudgeIcon} aria-hidden="true">
            <ShieldCheck size={20} strokeWidth={2} />
          </span>
          <span className={styles.nudgeText}>
            <strong>Complete your profile</strong>
            <span>Checkout needs your name, email and address.</span>
          </span>
          <button type="button" className={`${styles.btnSm} ${styles.btnDark}`} onClick={() => setEditing(true)}>
            Complete now
          </button>
        </div>
      )}

      {kyc && (
        <button type="button" className={`${styles.verifyRow} ${licenceVerified ? styles.verifyOk : ""}`} onClick={() => go("documents")}>
          <span className={`${styles.rowIcon} ${licenceVerified ? styles.rowIconOk : ""}`} aria-hidden="true">
            <BadgeCheck size={19} strokeWidth={2} />
          </span>
          <span className={styles.rowText}>
            <span className={styles.rowTitle}>{licenceVerified ? "Driving licence verified" : "Verify your driving licence"}</span>
            <span className={styles.rowLabel}>{licenceVerified ? "Verified through DigiLocker" : "Needed to book. Takes a minute with DigiLocker."}</span>
          </span>
          <ChevronRight className={styles.chev} size={18} aria-hidden="true" />
        </button>
      )}

      <div className={styles.stats}>
        {stats.map((s) => (
          <button key={s.key} type="button" className={styles.stat} onClick={() => go("orders", s.key)}>
            <span className={styles.statValue} data-mm-keep>
              {tripsReady ? s.value : "–"}
            </span>
            <span className={styles.statLabel}>
              {s.label}
              <ChevronRight size={15} strokeWidth={2} aria-hidden="true" />
            </span>
          </button>
        ))}
      </div>

      <div className={styles.group}>
        {rows.map(({ Icon, label, value, locked }) => (
          <div key={label} className={styles.row}>
            <span className={styles.rowIcon} aria-hidden="true">
              <Icon size={18} strokeWidth={2} />
            </span>
            <span className={styles.rowText}>
              <span className={styles.rowLabel}>{label}</span>
              <span className={`${styles.rowValue} ${value ? "" : styles.rowEmpty}`}>{loading ? <span className={`${styles.skelLine} ${styles.shimmer}`} style={{ width: 140 }} /> : value || "Not added yet"}</span>
            </span>
            {locked && <Lock className={styles.rowLock} size={15} strokeWidth={2} aria-label="Can't be changed" />}
          </div>
        ))}
      </div>

      <EditProfileSheet open={editing} onClose={() => setEditing(false)} profile={profile} onSaved={onSaved} />
    </section>
  );
}

const KEYS = ["first_name", "last_name", "email", "gender", "address"];
const REQUIRED = ["first_name", "last_name", "email", "gender", "address"]; // all five (checkout needs them); in screen order
const LIMITS = { first_name: 50, last_name: 50, email: 120, address: 300 };

function fromProfile(d = {}) {
  return Object.fromEntries(KEYS.map((k) => [k, d[k] || ""]));
}

// One message per field; blank required fields only complain on save
function problem(k, v, onSave) {
  const s = String(v || "").trim();
  if (!s) return onSave && REQUIRED.includes(k) ? { first_name: "Enter your first name", last_name: "Enter your last name", email: "Enter your email", gender: "Choose one", address: "Enter your address" }[k] : "";
  if (k === "email" && !EMAIL_RE.test(s)) return "That email doesn't look right. Check for typos.";
  return "";
}

// "+919876543210" or "9876543210" → "+91 98765 43210"
function prettyPhone(p) {
  const digits = String(p || "").replace(/\D/g, "");
  const local = digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits.length === 10 ? digits : "";
  return local ? `+91 ${local.slice(0, 5)} ${local.slice(5)}` : p;
}

function EditProfileSheet({ open, onClose, profile, onSaved }) {
  const [form, setForm] = useState(fromProfile());
  const [start, setStart] = useState(fromProfile());
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const keepRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const v = fromProfile(profile.data || {});
    setForm(v);
    setStart(v);
    setErrors({});
    setConfirming(false);
  }, [open, profile.data]);

  useEffect(() => {
    if (confirming) keepRef.current?.focus();
  }, [confirming]);

  const firstTime = !profile.data;
  const dirty = KEYS.some((k) => form[k].trim() !== start[k].trim());
  // A field counts once it's usable (a valid email, not just any text)
  const filled = KEYS.filter((k) => (k === "email" ? EMAIL_RE.test(form.email.trim()) : form[k].trim())).length;
  const complete = filled === KEYS.length;
  const pct = Math.round((filled / KEYS.length) * 100);
  const fullName = [form.first_name, form.last_name].map((s) => s.trim()).filter(Boolean).join(" ");
  const genderIndex = GENDERS.indexOf(form.gender);
  const emailOk = EMAIL_RE.test(form.email.trim());
  const phone = prettyPhone(profile.phone);

  // Close (×, Escape, backdrop, Cancel) asks first when there are unsaved edits
  const requestClose = () => {
    if (saving) return;
    if (dirty) setConfirming(true);
    else onClose();
  };

  const set = (k) => (e) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, [k]: value }));
    if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined }));
    if (confirming) setConfirming(false);
  };

  const blur = (k) => () => {
    const msg = problem(k, form[k], false);
    if (msg) setErrors((x) => ({ ...x, [k]: msg }));
  };

  const save = async (ev) => {
    ev.preventDefault();
    if (!dirty || !complete || saving) return;
    const me = readToken();
    if (!me?.sub) return toast.error("Please log in to update your profile");
    const e = {};
    for (const k of KEYS) {
      const msg = problem(k, form[k], true);
      if (msg) e[k] = msg;
    }
    setErrors(e);
    const firstBad = REQUIRED.concat("address").find((k) => e[k]);
    if (firstBad) {
      document.getElementById(`pf-${firstBad}`)?.focus();
      return;
    }

    setSaving(true);
    try {
      const clean = Object.fromEntries(KEYS.map((k) => [k, form[k].trim()]));
      const customerData = { user_id: me.sub, ...clean };
      const existing = await makeAuthenticatedRequest("GET", `customers?user_id=eq.${me.sub}&select=id`);
      const opts = { headers: { "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify(customerData) };
      if (existing && existing.length > 0) await makeAuthenticatedRequest("PATCH", `customers?user_id=eq.${me.sub}`, opts);
      else await makeAuthenticatedRequest("POST", "customers", opts);
      toast.success(firstTime ? "Profile saved" : "Changes saved");
      onClose();
      onSaved();
    } catch (err) {
      console.error("Error saving profile:", err);
      toast.error("We couldn't save your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const error = (k) =>
    errors[k] && (
      <span id={`pf-${k}-error`} className={styles.fieldError}>
        <CircleAlert size={14} strokeWidth={2.2} aria-hidden="true" />
        {errors[k]}
      </span>
    );

  const input = (k, label, Icon, props = {}) => (
    <div className={styles.field}>
      <label className={styles.fieldLabel} htmlFor={`pf-${k}`}>
        {label}
      </label>
      <span className={styles.control}>
        <Icon className={styles.controlIcon} size={18} strokeWidth={2} aria-hidden="true" />
        <input
          id={`pf-${k}`}
          className={`${styles.input} ${styles.withIcon} ${errors[k] ? styles.inputError : ""}`}
          value={form[k]}
          onChange={set(k)}
          onBlur={blur(k)}
          maxLength={LIMITS[k]}
          aria-invalid={Boolean(errors[k])}
          aria-describedby={errors[k] ? `pf-${k}-error` : undefined}
          {...props}
        />
      </span>
      {error(k)}
    </div>
  );

  return (
    <Sheet
      open={open}
      onClose={requestClose}
      title={firstTime ? "Add your details" : "Edit profile"}
      lead="Used for your bookings, invoices and checkout."
      onSubmit={save}
      footer={
        confirming ? (
          <div className={styles.discard} role="alert">
            <span className={styles.discardText}>Discard your changes?</span>
            <span className={styles.discardButtons}>
              <button ref={keepRef} type="button" className={`${styles.btn} ${styles.btnLine}`} onClick={() => setConfirming(false)}>
                Keep editing
              </button>
              <button type="button" className={`${styles.btn} ${styles.btnDanger}`} onClick={onClose}>
                Discard
              </button>
            </span>
          </div>
        ) : (
          <>
            <span className={styles.footNote} aria-live="polite">
              {dirty && complete ? "Unsaved changes" : ""}
            </span>
            <button type="button" className={`${styles.btn} ${styles.btnLine}`} onClick={requestClose}>
              Cancel
            </button>
            {/* Fills up as details are added (20% each); usable only when all five are there */}
            <button
              type="submit"
              className={`${styles.btn} ${styles.fillBtn} ${complete ? styles.fillBtnDone : ""}`}
              style={{ "--fill": `${pct}%` }}
              disabled={!complete || !dirty || saving}
              aria-busy={saving}
              aria-label={complete ? undefined : `Save changes. ${pct}% of your details are filled in.`}
            >
              {[styles.fillBtnBase, styles.fillBtnFill].map((layer) => (
                <span key={layer} className={layer} aria-hidden={layer === styles.fillBtnFill ? true : undefined}>
                  {saving ? (
                    <>
                      <span className={styles.btnSpinner} aria-hidden="true" />
                      Saving
                    </>
                  ) : complete ? (
                    "Save changes"
                  ) : (
                    `${pct}% complete`
                  )}
                </span>
              ))}
            </button>
          </>
        )
      }
    >
      <div className={styles.idCard}>
        <span className={styles.idRing} style={{ "--mm-ring": (filled / KEYS.length) * 100 }} aria-hidden="true">
          <span className={styles.idAvatar}>{initials(form.first_name, form.last_name) || <UserRound size={22} strokeWidth={2} />}</span>
        </span>
        <span className={styles.idText}>
          <span className={`${styles.idName} ${fullName ? "" : styles.idNameEmpty}`}>{fullName || "Your name"}</span>
          {phone && (
            <span className={styles.idPhone} title="Your phone number is your login, so it can't be changed">
              <Lock size={13} strokeWidth={2.2} aria-hidden="true" />
              <span>{phone}</span>
              <span className={styles.idMuted}>Login number</span>
            </span>
          )}
        </span>
        <span className={`${styles.idChip} ${complete ? styles.idChipOk : ""}`}>
          {complete ? (
            <>
              <CircleCheck size={14} strokeWidth={2.2} aria-hidden="true" />
              Profile complete
            </>
          ) : (
            `${filled} of ${KEYS.length} added`
          )}
        </span>
      </div>

      <div className={styles.formGroup}>
        <h3 className={styles.formGroupTitle}>Personal details</h3>
        <div className={styles.fieldRow}>
          {input("first_name", "First name", UserRound, { autoComplete: "given-name", autoCapitalize: "words", placeholder: "First name" })}
          {input("last_name", "Last name", UserRound, { autoComplete: "family-name", autoCapitalize: "words", placeholder: "Last name" })}
        </div>
        <fieldset className={styles.field} aria-describedby={errors.gender ? "pf-gender-error" : undefined}>
          <legend className={styles.fieldLabel}>Gender</legend>
          <div className={`${styles.seg} ${errors.gender ? styles.segError : ""}`} style={{ "--seg-i": Math.max(genderIndex, 0), "--seg-on": genderIndex >= 0 ? 1 : 0 }}>
            {GENDERS.map((g, i) => (
              <label key={g} className={`${styles.segOption} ${form.gender === g ? styles.segOn : ""}`}>
                <input id={i === 0 ? "pf-gender" : undefined} type="radio" name="pf-gender" value={g} checked={form.gender === g} onChange={set("gender")} />
                {g}
              </label>
            ))}
          </div>
          {error("gender")}
        </fieldset>
      </div>

      <div className={styles.formGroup}>
        <h3 className={styles.formGroupTitle}>Contact</h3>
        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor="pf-email">
            Email
          </label>
          <span className={styles.control}>
            <Mail className={styles.controlIcon} size={18} strokeWidth={2} aria-hidden="true" />
            <input
              id="pf-email"
              className={`${styles.input} ${styles.withIcon} ${styles.withOk} ${errors.email ? styles.inputError : ""}`}
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="you@example.com"
              value={form.email}
              onChange={set("email")}
              onBlur={blur("email")}
              maxLength={LIMITS.email}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "pf-email-error" : "pf-email-hint"}
            />
            {emailOk && !errors.email && <CircleCheck className={styles.controlOk} size={18} strokeWidth={2.2} aria-hidden="true" />}
          </span>
          {error("email") || (
            <span id="pf-email-hint" className={styles.fieldHint}>
              Booking confirmations and invoices go here.
            </span>
          )}
        </div>
        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor="pf-address">
            Address
          </label>
          <span className={`${styles.control} ${styles.controlTop}`}>
            <MapPin className={styles.controlIcon} size={18} strokeWidth={2} aria-hidden="true" />
            <textarea
              id="pf-address"
              className={`${styles.input} ${styles.withIcon}`}
              rows={3}
              value={form.address}
              onChange={set("address")}
              maxLength={LIMITS.address}
              autoComplete="street-address"
              placeholder="House or flat, street, area, city"
              aria-describedby="pf-address-hint"
            />
          </span>
          <span id="pf-address-hint" className={styles.fieldHint}>
            Needed at checkout and printed on your invoice.
          </span>
        </div>
      </div>
    </Sheet>
  );
}
