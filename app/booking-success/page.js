import React, { Suspense } from "react";
import BookingSuccessClient from "./BookingSuccessClient";
import "./bookingSuccess.css"; // We can keep the CSS import here

// This is a simple server component that will be shown instantly
// while the browser loads the client component.
function LoadingState() {
  return (
    <div className="booking-success-page">
      <div className="success-card">
        <h1 className="title">Loading Booking Details...</h1>
        <p className="subtitle">Finalizing your confirmation.</p>
      </div>
    </div>
  );
}

// This is the main page component. It's now a Server Component.
export default function BookingSuccessPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <BookingSuccessClient />
    </Suspense>
  );
}
