import React, { Suspense } from "react";
import OtpClient from "./OtpClient";
import "./otp.css";

// A simple loading state for the OTP page
function LoadingState() {
    // TODO: design a more specific loading skeleton if u want
    return (
        <div className="otp-container">
            <p>Loading OTP form...</p>
        </div>
    );
}

// The main Server Component for the OTP page
export default function OtpPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <OtpClient />
    </Suspense>
  );
}
