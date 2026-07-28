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
  const [aadharNumber, setAadharNumber] = useState("");

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
    const normalizedAadhaar = aadharNumber.replace(/\s|-/g, "");
    const declaredName = localStorage.getItem("hreg_full_name") || "";
    if (!/^\d{12}$/.test(normalizedAadhaar)) {
      setVerificationStatus("failed");
      setErrorMessage("Enter a valid 12-digit Aadhaar number to continue.");
      return;
    }
    if (!declaredName.trim()) {
      router.replace("/host-registration-form");
      return;
    }
    setVerificationStatus("verifying");
    // Persist the applicant name and masked Aadhaar before the OAuth redirect.
    // The API never stores the full Aadhaar number.
    fetch("/api/host/kyc/prepare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aadhaarNumber: normalizedAadhaar, declaredName }),
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
                <p>Require Govt Identity</p>
              </div>
            </div>

            <div className={styles.hregField}>
              <label>Enter Aadhaar Number</label>
              <input 
                type="text" 
                placeholder="Enter 12-digit Aadhaar Number"
                value={aadharNumber}
                onChange={(e) => setAadharNumber(e.target.value)}
                disabled={verificationStatus === "success" || verificationStatus === "verifying"}
              />
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
                <p>1. Login With OTP</p>
                <p>2. Verify and Start</p>
                
                <button 
                  onClick={handleVerifyClick}
                  disabled={verificationStatus === "success" || verificationStatus === "verifying"}
                >
                  {verificationStatus === "verifying" ? "Redirecting..." : "Verify"}
                </button>
              </div>
            </div>

            {verificationStatus === "success" && (
              <p className={styles.hregKycText}>
                ✓ Congratulations! Your KYC verification is complete.
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
                Connecting to DigiLocker secure portal...
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
