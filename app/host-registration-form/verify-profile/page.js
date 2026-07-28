"use client";

import { Suspense, useState, useEffect } from "react";
import Image from "next/image";
import styles from "../HostRegistration.module.css";
import { useRouter, useSearchParams } from "next/navigation";

function VerifyProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [verificationStatus, setVerificationStatus] = useState("pending"); // pending, success, failed, verifying
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const status = searchParams.get("status");
    const error = searchParams.get("error");

    if (status === "success") {
      setVerificationStatus("success");
    } else if (status === "failed") {
      setVerificationStatus("failed");
      setErrorMessage(error || "Verification failed. Please try again.");
    }
  }, [searchParams]);

  const handleVerifyClick = () => {
    const declaredName = localStorage.getItem("hreg_full_name") || "";
    if (!declaredName.trim()) {
      router.replace("/host-registration-form");
      return;
    }
    setVerificationStatus("verifying");
    // Persist only the applicant's host name before the OAuth redirect.
    fetch("/api/host/kyc/prepare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ declaredName }),
    })
      .then(async (response) => {
        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.error || "Could not start verification.");
        }
        window.location.assign("/api/auth/digilocker");
      })
      .catch((error) => {
        setVerificationStatus("failed");
        setErrorMessage(error.message || "Could not start verification.");
      });
  };

  return (
    <div className={styles.hregpage}>
      <section className={styles.hregSection}>
        <div className={styles.hregContainer}>
          {/* LEFT PREVIEW IMAGE */}
          <div className={styles.hregLeftCard}>
            <Image
              src="/Best-car-hosting-registration2.webp"
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
                  alt="Verify"
                  width={28}
                  height={28}
                />
              </div>
              <div>
                <h2>Verify Profile</h2>
                <p>Verify securely with DigiLocker</p>
              </div>
            </div>

            <div className={styles.hregDigiLockerBox}>
              <div className={styles.hregDigiLockerLeft}>
                <Image
                  src="/digilocker.webp"
                  alt="Digilocker"
                  width={90}
                  height={102}
                />
              </div>

              <div className={styles.hregDigiLockerRight}>
                <p>1. Sign in securely with DigiLocker</p>
                <p>2. Share PAN or Driving Licence</p>
                
                <button 
                  onClick={handleVerifyClick}
                  disabled={verificationStatus === "success" || verificationStatus === "verifying"}
                >
                  {verificationStatus === "verifying" ? "Opening DigiLocker..." : "VERIFY WITH DIGILOCKER"}
                </button>
              </div>
            </div>

            {verificationStatus === "success" && (
              <p className={styles.hregKycText}>
                ✓ DigiLocker verification is complete. You can continue your host registration.
              </p>
            )}

            {verificationStatus === "failed" && (
              <div className={styles.hregKycFailed}>
                <p style={{ color: "#d9534f", fontWeight: "bold" }}>Verification Failed</p>
                <p>{errorMessage}</p>
              </div>
            )}

            {verificationStatus === "verifying" && (
              <p style={{ textAlign: "center", color: "#6c4cff", fontWeight: "500", marginTop: "14px" }}>
                Opening the secure DigiLocker portal. Do not close this page.
              </p>
            )}

            {verificationStatus === "success" ? (
              <button
                className={styles.hregVerifyBtn}
                onClick={() => router.push("/host-registration-form/confirmation")}
              >
                PROCEED
              </button>
            ) : (
              <button
                className={styles.hregVerifyBtn}
                style={{ opacity: 0.5, cursor: "not-allowed" }}
                disabled
              >
                PROCEED
              </button>
            )}

            {verificationStatus === "failed" && (
              <div className={styles.hregFailedButtons}>
                <button onClick={() => setVerificationStatus("pending")}>
                  TRY AGAIN
                </button>
                <button onClick={() => router.push("/contact-us")}>
                  CONTACT US
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default function VerifyProfile() {
  return (
    <Suspense fallback={<div style={{ padding: "40px", textAlign: "center" }}>Loading verification screen...</div>}>
      <VerifyProfileContent />
    </Suspense>
  );
}
