"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import "./otp.css";

export default function OtpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = searchParams.get("user"); // ✅ fetch phone/email

  const [otp, setOtp] = useState(["", "", "", ""]);
  const inputs = useRef([]);

  const handleChange = (e, index) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 3) inputs.current[index + 1].focus();
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1].focus();
    }
  };

  // ✅ Auto-submit once 4 digits filled
  useEffect(() => {
    if (otp.join("").length === 4) {
      // fake validation
      setTimeout(() => {
        router.push("/dashboard");
      }, 500); // small delay for better UX
    }
  }, [otp, router]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (otp.join("").length !== 4) {
      alert("Enter a valid 4-digit OTP");
      return;
    }
    router.push("/dashboard");
  };

  return (
    <div className="otp-container">
      <div className="otp-left">
        <Image src="/login banner2.png" alt="Banner" width={600} height={180} />
        <Image src="/our car2.png" alt="Car" width={600} height={200} />
      </div>
      <div className="otp-right">
        <h2>
          LOGIN TO <br /> URBAN CAR
        </h2>
        <div className="otp-box">
          <p>📩</p>
          <h3>Check Your Inbox</h3>
          <p>
            We sent a 4-digit code to your <br />
            <b>{user || "your account"}</b>
          </p>

          <form onSubmit={handleSubmit} className="otp-form">
            <div className="otp-inputs">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(e, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  ref={(el) => (inputs.current[index] = el)}
                />
              ))}
            </div>

            <button type="submit" className="verify-btn">
              Verify
            </button>
          </form>

          <p className="resend">
            Not received yet? <span>Resend Now</span>
          </p>
        </div>
      </div>
    </div>
  );
}
