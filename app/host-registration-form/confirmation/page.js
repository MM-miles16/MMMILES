"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import styles from "../HostRegistration.module.css";

export default function ConfirmationPage() {
  const router = useRouter();

  const [kycData, setKycData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Input states from localStorage
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    // 1. Retrieve initial form inputs from localStorage
    if (typeof window !== "undefined") {
      setFullName(localStorage.getItem("hreg_full_name") || "");
      setEmail(localStorage.getItem("hreg_email") || "");
      setAddress(localStorage.getItem("hreg_address") || "");
    }

    // 2. Fetch verified identity documents from server-side database
    fetch("/api/host/kyc")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to contact KYC API");
        return res.json();
      })
      .then((data) => {
        if (data.verified && data.kyc) {
          setKycData(data.kyc);
          setFullName(data.kyc.declared_name || "");
        } else {
          // Edge Case: If user bypassed /verify-profile and visited this page directly, redirect back
          console.warn("Direct access detected: user has not completed KYC verification.");
          router.push("/host-registration-form/verify-profile?status=failed&error=Please complete DigiLocker verification first");
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to retrieve host KYC data:", err);
        setError("Could not retrieve government records. Please verify again.");
        setLoading(false);
      });
  }, [router]);

  const handleSubmit = async () => {
    if (!termsAccepted || submitting) return;
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/host/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: fullName,
          email,
          address,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to submit host registration.");
      }

      // Success: clear temporary inputs. The preceding history entry becomes
      // Home so Back never exposes a completed KYC/OAuth step.
      localStorage.removeItem("hreg_full_name");
      localStorage.removeItem("hreg_email");
      localStorage.removeItem("hreg_address");

      // Set user's name in session storage to greet them on the success page
      sessionStorage.setItem("registered_host_name", fullName || "Host");
      window.history.replaceState(null, "", "/");
      router.push("/host-registration-form/success");
    } catch (err) {
      console.error("Submission error:", err);
      setError(err.message || "Failed to complete registration. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.hregpage}>
      <section className={styles.hregSection}>
        <div className={styles.hregContainer}>
          {/* LEFT IMAGE */}
          <div className={styles.hregLeftCard}>
            <Image
              src="/Best-car-hosting-registration3.webp"
              alt="Registration"
              fill
              priority
              className={styles.hregPreviewImage}
            />
          </div>

          {/* RIGHT CARD */}
          <div className={styles.hregRightCard}>
            <div className={styles.hregHeader}>
              <div className={styles.hregIconBox}>
                <Image
                  src="/verify-profile-icon.svg"
                  alt="Confirmation"
                  width={28}
                  height={28}
                />
              </div>
              <div>
                <h2>Confirmation</h2>
                <p>Check your Details</p>
              </div>
            </div>

            {loading ? (
              <div style={{ padding: "40px 0", textAlign: "center", color: "#666" }}>
                Fetching verified government records...
              </div>
            ) : (
              <>
                <div className={styles.hregField}>
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    readOnly
                    aria-readonly="true"
                  />
                  {kycData?.aadhaar_name && fullName.toLowerCase() !== kycData.aadhaar_name.toLowerCase() && (
                    <span style={{ fontSize: "11px", color: "#ff8c00", fontWeight: "600" }}>
                      Your DigiLocker verified name is: <strong>{kycData.aadhaar_name}</strong>. Your host profile will use the name you entered.
                    </span>
                  )}
                </div>

                <div className={styles.hregField}>
                  <label>Email ID</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Confirm your email"
                  />
                </div>

                <div className={styles.hregField}>
                  <label>Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Confirm your address"
                  />
                </div>

                <div style={{ margin: "20px 0", borderTop: "1px dashed #ccc", paddingTop: "15px" }}>
                  <p style={{ fontSize: "12px", color: "#666", fontWeight: "bold", marginBottom: "8px" }}>
                    Verified Government Identity (Read-Only)
                  </p>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div style={{ fontSize: "12px", display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#777" }}>PAN status:</span>
                      <span style={{ fontWeight: "600", color: "#28a745" }}>{kycData?.pan_number ? "✅ Verified" : "Not Provided"}</span>
                    </div>
                    <div style={{ fontSize: "12px", display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#777" }}>DL status:</span>
                      <span style={{ fontWeight: "600", color: "#28a745" }}>{kycData?.driving_licence ? "✅ Verified" : "Not Provided"}</span>
                    </div>
                  </div>
                </div>

                <div className={styles.hregTermsRow}>
                  <input
                    type="checkbox"
                    id="terms"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                  />
                  <label htmlFor="terms">
                    By creating an account, you agree to our Policy.
                  </label>
                </div>

                {error && (
                  <p style={{ color: "#d9534f", fontSize: "13px", fontWeight: "600", marginBottom: "15px" }}>
                    {error}
                  </p>
                )}

                <button
                  className={styles.hregVerifyBtn}
                  onClick={handleSubmit}
                  disabled={!termsAccepted || submitting}
                  style={{
                    opacity: termsAccepted && !submitting ? 1 : 0.5,
                    cursor: termsAccepted && !submitting ? "pointer" : "not-allowed",
                  }}
                >
                  {submitting ? "Submitting..." : "Verify & Submit"}
                </button>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
