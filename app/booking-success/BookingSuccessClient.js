"use client";
import { useSearchParams } from "next/navigation";
import "./bookingSuccess.css";

export default function BookingSuccess() {
  const params = useSearchParams();
  const name = params.get("name");
  const type = params.get("type");
  const price = params.get("price");
  const location = params.get("location");
  const pickup = params.get("pickup");
  const returndate = params.get("return");

  return (
    <div className="booking-success-page">
      <div className="success-card">
        {/* Animated glowing ring + SVG checkmark */}
        <div className="glow-ring">
          <svg
            className="check-svg"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 52 52"
          >
            <circle className="check-circle" cx="26" cy="26" r="25" />
            <path
              className="check-tick"
              fill="none"
              d="M14 27l7 7 17-17"
            />
          </svg>
        </div>

        <h1 className="title">Your Booking is Confirmed!</h1>
        <p className="subtitle">
          Sit back and relax — your car will be ready at your chosen location.
        </p>

        <div className="details">
          <h2>{name}</h2>
          <p className="type">{type}</p>
          <p className="price">{price}</p>
          <hr />
          <p>
            <strong>Pickup:</strong> {pickup}
          </p>
          <p>
            <strong>Return:</strong> {returndate}
          </p>
          <p>
            <strong>Location:</strong> {location}
          </p>
        </div>

        <button
          className="back-btn"
          onClick={() => (window.location.href = "/")}
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}
