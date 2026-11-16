"use client";
// Saved addresses for home delivery, in the "review card" panel look: one panel per address (label,
// default tag, address, landmark; edit, set default, delete with a confirm step) and an "Add address"
// panel. Adding or editing opens a popup right here, with "Use my current location" to fill the
// address in. Checkout lists these to choose from, starting with the default.
// Before saved addresses are switched on (no table yet), the panel shows the profile address and the
// same popup saves to the profile instead, which is what checkout uses for delivery.
import { useEffect, useState } from "react";
import { BriefcaseBusiness, ChevronRight, CircleAlert, CircleCheck, House, Landmark, LocateFixed, MapPin, Pencil, Plus, RotateCcw, Star, Trash2, Truck } from "lucide-react";
import { toast } from "react-hot-toast";
import { makeAuthenticatedRequest } from "../../../lib/customSupabaseClient";
import { deliveryText } from "../../../lib/addressText";
import { currentAddress } from "../../../lib/geo";
import { Card, Head, LoadError, readToken, send, Sheet, SkeletonRows, useApi } from "../shared";
import styles from "../dashboard.module.css";

const LABELS = [
  { id: "Home", Icon: House },
  { id: "Work", Icon: BriefcaseBusiness },
  { id: "Other", Icon: MapPin },
];
const iconFor = (label) => (/^home$/i.test(label) ? House : /^work$/i.test(label) ? BriefcaseBusiness : MapPin);
const BLANK = { id: null, preset: "Home", custom: "", address: "", landmark: "", isDefault: false };

/* ---------- the add / edit popup ---------- */

// mode "saved": a saved address (label, default). mode "profile": the single profile address.
function AddressSheet({ form, setForm, mode, firstAddress, saving, onSave, onClose }) {
  const [errors, setErrors] = useState({});
  const [loc, setLoc] = useState({ status: "idle", error: "" });
  const open = Boolean(form);

  // Start fresh every time the popup opens
  useEffect(() => {
    if (!open) return;
    setErrors({});
    setLoc({ status: "idle", error: "" });
  }, [open]);
  const saved = mode === "saved";
  const labelIndex = form ? LABELS.findIndex((l) => l.id === form.preset) : 0;

  const update = (patch) => {
    setForm((f) => ({ ...f, ...patch }));
    setErrors((e) => ({ ...e, ...Object.fromEntries(Object.keys(patch).map((k) => [k, undefined])) }));
  };

  const locate = async () => {
    setLoc({ status: "busy", error: "" });
    try {
      const { address } = await currentAddress();
      update({ address });
      setLoc({ status: "done", error: "" });
    } catch (err) {
      setLoc({ status: "error", error: err.message });
    }
  };

  const submit = (e) => {
    e.preventDefault();
    const err = {};
    if (saved && form.preset === "Other" && !form.custom.trim()) err.custom = "Give this address a name, like Mom's place";
    if (form.address.trim().length < 5) err.address = "Please enter the full address, with area and city";
    setErrors(err);
    const first = ["custom", "address"].find((k) => err[k]);
    if (first) return document.getElementById(`ad-${first}`)?.focus();
    onSave();
  };

  const close = () => {
    setErrors({});
    setLoc({ status: "idle", error: "" });
    onClose();
  };

  const busy = loc.status === "busy";
  const done = loc.status === "done";

  return (
    <Sheet
      open={open}
      onClose={close}
      title={form?.id || (!saved && form?.address && form?.editing) ? "Edit address" : "Add an address"}
      lead="We deliver and pick up your car here. Choose it at checkout."
      onSubmit={submit}
      footer={
        <>
          <button type="button" className={`${styles.btn} ${styles.btnLine}`} onClick={close}>
            Cancel
          </button>
          <button type="submit" className={`${styles.btn} ${styles.btnDark}`} disabled={saving} aria-busy={saving}>
            {saving ? (
              <>
                <span className={styles.btnSpinner} aria-hidden="true" />
                Saving
              </>
            ) : (
              "Save address"
            )}
          </button>
        </>
      }
    >
      {form && (
        <>
          <button
            type="button"
            className={`${styles.locate} ${busy ? styles.locateBusy : ""} ${done ? styles.locateDone : ""}`}
            onClick={locate}
            disabled={busy}
            aria-describedby={loc.error ? "ad-loc-error" : undefined}
          >
            <span className={styles.locateIcon} aria-hidden="true">
              {busy ? <span className={`${styles.btnSpinner} ${styles.spinLight}`} /> : done ? <CircleCheck size={19} strokeWidth={2.2} /> : <LocateFixed size={19} strokeWidth={2.2} />}
            </span>
            <span className={styles.locateLabel} aria-live="polite">
              {busy ? "Finding your location…" : done ? "Location added" : "Use my current location"}
            </span>
            {!busy && (done ? <RotateCcw className={styles.locateEnd} size={16} strokeWidth={2.2} aria-label="Try again" /> : <ChevronRight className={styles.locateEnd} size={18} strokeWidth={2.2} aria-hidden="true" />)}
          </button>
          {loc.error && (
            <span id="ad-loc-error" className={styles.fieldError} role="alert">
              <CircleAlert size={14} strokeWidth={2.2} aria-hidden="true" />
              {loc.error}
            </span>
          )}

          <div className={styles.orRule}>
            <span>{done ? "Your address" : "or type it"}</span>
          </div>

          {saved && (
            <fieldset className={styles.field}>
              <legend className={styles.fieldLabel}>Save as</legend>
              <div className={styles.seg} style={{ "--seg-i": Math.max(labelIndex, 0), "--seg-on": 1 }}>
                {LABELS.map(({ id, Icon }) => (
                  <label key={id} className={`${styles.segOption} ${form.preset === id ? styles.segOn : ""}`}>
                    <input type="radio" name="ad-label" value={id} checked={form.preset === id} onChange={() => update({ preset: id })} />
                    <Icon size={15} strokeWidth={2} aria-hidden="true" />
                    {id}
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {saved && form.preset === "Other" && (
            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor="ad-custom">
                Name
              </label>
              <span className={styles.control}>
                <MapPin className={styles.controlIcon} size={18} strokeWidth={2} aria-hidden="true" />
                <input
                  id="ad-custom"
                  className={`${styles.input} ${styles.withIcon} ${errors.custom ? styles.inputError : ""}`}
                  maxLength={30}
                  value={form.custom}
                  onChange={(e) => update({ custom: e.target.value })}
                  placeholder="For example, Mom's place"
                  aria-invalid={Boolean(errors.custom)}
                />
              </span>
              {errors.custom && (
                <span className={styles.fieldError}>
                  <CircleAlert size={14} strokeWidth={2.2} aria-hidden="true" />
                  {errors.custom}
                </span>
              )}
            </div>
          )}

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="ad-address">
              Full address
            </label>
            <span className={`${styles.control} ${styles.controlTop}`}>
              <MapPin className={styles.controlIcon} size={18} strokeWidth={2} aria-hidden="true" />
              <textarea
                id="ad-address"
                className={`${styles.input} ${styles.withIcon} ${errors.address ? styles.inputError : ""}`}
                rows={3}
                maxLength={300}
                value={form.address}
                onChange={(e) => update({ address: e.target.value })}
                placeholder="House or flat, street, area, city"
                autoComplete="street-address"
                aria-invalid={Boolean(errors.address)}
              />
            </span>
            {errors.address && (
              <span className={styles.fieldError}>
                <CircleAlert size={14} strokeWidth={2.2} aria-hidden="true" />
                {errors.address}
              </span>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="ad-landmark">
              Landmark <span className={styles.fieldOptional}>(optional)</span>
            </label>
            <span className={styles.control}>
              <Landmark className={styles.controlIcon} size={18} strokeWidth={2} aria-hidden="true" />
              <input
                id="ad-landmark"
                className={`${styles.input} ${styles.withIcon}`}
                maxLength={120}
                value={form.landmark}
                onChange={(e) => update({ landmark: e.target.value })}
                placeholder="Near a temple, school, metro station"
              />
            </span>
            <span className={styles.fieldHint}>Helps our driver find you quickly.</span>
          </div>

          {saved && !firstAddress && (
            <label className={styles.switchRow}>
              <input type="checkbox" checked={form.isDefault} onChange={(e) => update({ isDefault: e.target.checked })} />
              <span className={styles.switch} aria-hidden="true" />
              <span>
                <strong>Make this my default</strong>
                <span className={styles.fieldHint}>Picked first at checkout</span>
              </span>
            </label>
          )}
        </>
      )}
    </Sheet>
  );
}

/* ---------- the page ---------- */

export default function Addresses({ onBack, profile, onProfileSaved }) {
  const api = useApi("/api/dashboard/addresses");
  const profileAddress = (profile?.data?.address || "").trim();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const list = api.data?.addresses || [];
  const max = api.data?.max || 10;
  const mode = api.status === "setup" ? "profile" : "saved";

  const open = (a) => {
    if (mode === "profile") return setForm({ ...BLANK, address: profileAddress, editing: Boolean(profileAddress) });
    if (!a) return setForm({ ...BLANK, isDefault: list.length === 0 });
    const preset = ["Home", "Work"].find((p) => p.toLowerCase() === a.label.toLowerCase()) || "Other";
    setForm({ id: a.id, preset, custom: preset === "Other" ? a.label : "", address: a.address, landmark: a.landmark, isDefault: a.isDefault });
  };

  // Saved addresses go to the dashboard API; before that exists, to the profile (used by checkout)
  const save = async () => {
    setSaving(true);
    try {
      if (mode === "saved") {
        const label = form.preset === "Other" ? form.custom.trim() : form.preset;
        const body = { label, address: form.address.trim(), landmark: form.landmark.trim(), isDefault: form.isDefault || list.length === 0 };
        api.replace(form.id ? await send(`/api/dashboard/addresses/${form.id}`, "PATCH", body) : await send("/api/dashboard/addresses", "POST", body));
        toast.success(form.id ? "Address updated" : "Address saved");
      } else {
        const me = readToken();
        if (!me?.sub) throw new Error("Please log in again to save your address.");
        const address = deliveryText(form.address, form.landmark);
        const existing = await makeAuthenticatedRequest("GET", `customers?user_id=eq.${me.sub}&select=id`);
        const opts = { headers: { "Content-Type": "application/json", Prefer: "return=minimal" } };
        if (existing?.length) await makeAuthenticatedRequest("PATCH", `customers?user_id=eq.${me.sub}`, { ...opts, body: JSON.stringify({ address }) });
        else await makeAuthenticatedRequest("POST", "customers", { ...opts, body: JSON.stringify({ user_id: me.sub, address }) });
        toast.success("Delivery address saved");
        onProfileSaved?.();
      }
      setForm(null);
    } catch (error) {
      console.error("Error saving address:", error);
      toast.error(error.message && !/fetch|HTTP|status/i.test(error.message) ? error.message : "We couldn't save your address. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const act = async (fn, done) => {
    try {
      api.replace(await fn());
      toast.success(done);
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <section aria-labelledby="dash-title">
      <Head title="Saved addresses" lead="Where we deliver your car to your door. Choose any of these at checkout." onBack={onBack} />

      {api.status === "loading" && <SkeletonRows count={2} height={120} />}
      {api.status === "error" && <LoadError onRetry={api.reload} />}

      {api.status === "setup" && (
        // Saved addresses aren't switched on yet: the profile address delivery uses today
        <div className={styles.panels}>
          <Card
            panel
            Icon={House}
            tone="dark"
            title="Delivery address"
            badge={profileAddress ? <span className={`${styles.chip} ${styles.chipUpcoming}`}>Used at checkout</span> : null}
            meta={profileAddress ? "Picked first at checkout" : "Add it once, and checkout fills it in for you"}
            actions={
              profileAddress ? (
                <button type="button" className={`${styles.btn} ${styles.btnLine}`} onClick={() => open(null)}>
                  <Pencil size={16} strokeWidth={2} aria-hidden="true" />
                  Edit
                </button>
              ) : (
                <button type="button" className={`${styles.btn} ${styles.btnDark}`} onClick={() => open(null)}>
                  <Plus size={17} strokeWidth={2.2} aria-hidden="true" />
                  Add address
                </button>
              )
            }
          >
            {profile?.status === "loading" ? <span className={`${styles.skelLine} ${styles.shimmer}`} style={{ width: 200 }} /> : profileAddress || "No address yet. Add your home or office for doorstep delivery."}
          </Card>
          <Card panel Icon={Truck} tone="plain" title="How your address is used" className={styles.cardInfo}>
            We deliver and pick up your car at this address. At checkout you can keep it or type a different one for that trip.
          </Card>
        </div>
      )}

      {api.status === "ready" && (
        <div className={styles.panels}>
          {list.map((a) => (
            <Card
              panel
              key={a.id}
              Icon={iconFor(a.label)}
              tone={a.isDefault ? "dark" : undefined}
              title={a.label}
              badge={a.isDefault ? <span className={`${styles.chip} ${styles.chipUpcoming}`}>Default</span> : null}
              meta={a.isDefault ? "Picked first at checkout" : "Available at checkout"}
              actions={
                confirmId === a.id ? (
                  <>
                    <span className={styles.confirmText}>Delete this address?</span>
                    <button type="button" className={`${styles.btnSm} ${styles.btnLine}`} onClick={() => setConfirmId(null)}>
                      Keep
                    </button>
                    <button
                      type="button"
                      className={`${styles.btnSm} ${styles.btnDanger}`}
                      onClick={() => {
                        setConfirmId(null);
                        act(() => send(`/api/dashboard/addresses/${a.id}`, "DELETE"), "Address deleted");
                      }}
                    >
                      Delete
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" className={`${styles.btn} ${styles.btnLine}`} onClick={() => open(a)}>
                      <Pencil size={14} strokeWidth={2} aria-hidden="true" />
                      Edit
                    </button>
                    {!a.isDefault && (
                      <button type="button" className={styles.linkBtn} onClick={() => act(() => send(`/api/dashboard/addresses/${a.id}`, "PATCH", { isDefault: true }), "Default address updated")}>
                        <Star size={14} strokeWidth={2} aria-hidden="true" />
                        Set as default
                      </button>
                    )}
                    <button type="button" className={`${styles.linkBtn} ${styles.linkDanger}`} onClick={() => setConfirmId(a.id)} aria-label={`Delete ${a.label}`}>
                      <Trash2 size={14} strokeWidth={2} aria-hidden="true" />
                      Delete
                    </button>
                  </>
                )
              }
            >
              {a.address}
              {a.landmark && <span className={styles.cardSub}>Near {a.landmark}</span>}
            </Card>
          ))}

          {list.length < max && (
            <Card panel Icon={Plus} add title="Add address" meta={list.length ? `${list.length} of ${max} saved` : "Home, work or anywhere else"} onClick={() => open(null)}>
              {list.length ? "Save another place for doorstep delivery. You can use your current location." : "Save your home or office so delivery is one tap at checkout. You can use your current location."}
            </Card>
          )}

          <Card panel Icon={Truck} tone="plain" title="How your addresses are used" className={styles.cardInfo}>
            We deliver and pick up your car at the address you choose. At checkout, your default is picked first, and you can switch to any saved address or type a new one.
          </Card>
        </div>
      )}

      <AddressSheet form={form} setForm={setForm} mode={mode} firstAddress={list.length === 0 || Boolean(form?.isDefault && form?.id)} saving={saving} onSave={save} onClose={() => setForm(null)} />
    </section>
  );
}
