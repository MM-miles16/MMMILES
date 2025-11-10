"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import "./login.css";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // ✅ Redirect only if token exists AND is valid
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) return;

    try {
      const payload = JSON.parse(
        atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
      );
      const now = Math.floor(Date.now() / 1000);
      if (payload?.exp && payload.exp > now) {
        router.push("/dashboard");
      } else {
        localStorage.removeItem("auth_token");
      }
    } catch {
      localStorage.removeItem("auth_token");
    }
  }, [router]);

  const handleContinue = async () => {
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
      setMessage("Please enter a valid 10-digit phone number");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: `91${phone}` }),
      });
      const data = await res.json();
      if (res.ok) {
        setStep(2);
        setOtp(["", "", "", ""]);
        setMessage("OTP sent successfully!");
      } else setMessage(data.error || "Failed to send OTP");
    } catch (err) {
      console.error(err);
      setMessage("Something went wrong while sending OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (entered = otp.join("")) => {
    if (entered.length !== 4) {
      setMessage("Enter the 4-digit OTP");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: `91${phone}`, otp: entered }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem("auth_token", data.token);

        // 🔔 Notify Navbar instantly
        window.dispatchEvent(new Event("auth-change"));

        // ✅ After successful login
        const redirectParam = new URLSearchParams(window.location.search).get("redirect");
        const redirectTo = redirectParam ? decodeURIComponent(redirectParam) : "/dashboard";

        router.push(redirectTo);
      } else setMessage(data.error || "Invalid OTP");
    } catch (err) {
      console.error(err);
      setMessage("Something went wrong while verifying OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (value, index) => {
    if (/^\d?$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      if (value && index < 3) {
        const next = document.getElementById(`otp-${index + 1}`);
        if (next) next.focus();
      }
      if (newOtp.every((digit) => digit !== "")) handleVerify(newOtp.join(""));
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prev = document.getElementById(`otp-${index - 1}`);
      if (prev) prev.focus();
    }
  };

  const handleOtpPaste = (e) => {
    const data = e.clipboardData.getData("text").trim();
    if (/^\d{4}$/.test(data)) {
      const newOtp = data.split("");
      setOtp(newOtp);
      handleVerify(data);
      const last = document.getElementById("otp-3");
      if (last) last.focus();
    }
    e.preventDefault();
  };

  const handleResendOtp = () => {
    setOtp(["", "", "", ""]);
    setMessage("");
    handleContinue();
  };

  return (
    <main className="login-wrapper">
      <div className="login-card">
        {/* Left section */}
        <div className="login-left">
          <Image
            src="/login banner.png"
            alt="Banner"
            width={400}
            height={150}
            className="banner-image"
          />
          <Image
            src="/our car2.png"
            alt="Car"
            width={400}
            height={300}
            className="car-image"
          />
        </div>

        {/* Right section */}
        <div className="login-right">
          {step === 1 && (
            <>
              <h2 className="form-title">LOGIN WITH US</h2>
              <input
                type="tel"
                placeholder="Enter your phone number"
                className="input-field"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <button
                className="continue-btn"
                onClick={handleContinue}
                disabled={loading}
              >
                {loading ? "Sending..." : "Continue"}
              </button>
              {message && <p className="info-text">{message}</p>}
            </>
          )}

          {step === 2 && (
            <div className="otp-card">
              <div className="otp-icon">📩</div>
              <h2 className="otp-title">Check Your Inbox</h2>
              <p className="otp-subtitle">
                We’ve sent a 4-digit verification code to <br />
                <strong>+91 {phone}</strong>
              </p>

              <div className="otp-inputs">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    type="text"
                    maxLength="1"
                    className="otp-box"
                    placeholder="-"
                    value={digit}
                    onChange={(e) => handleOtpChange(e.target.value, i)}
                    onKeyDown={(e) => handleOtpKeyDown(e, i)}
                    onPaste={handleOtpPaste}
                  />
                ))}
              </div>

              <p className="resend-text">
                Not received yet?{" "}
                <span className="resend-link" onClick={handleResendOtp}>
                  Resend Now
                </span>
              </p>
              <p className="go-back" onClick={() => setStep(1)}>
                Go Back
              </p>
              {message && <p className="info-text">{message}</p>}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
