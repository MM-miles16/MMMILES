"use client";
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import "./bookingSuccess.css";

export default function BookingSuccess() {
  const params = useSearchParams();
  const bookingId = params.get("booking");
  
  const [bookingData, setBookingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch booking details
  useEffect(() => {
    async function fetchBookingDetails() {
      if (!bookingId) {
        setError("Booking ID not found");
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem("auth_token");
        if (!token) {
          throw new Error("Authentication required");
        }

        const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        // Fetch booking with related vehicle and host data
        const response = await fetch(
          `${baseUrl}/rest/v1/bookings?id=eq.${bookingId}&select=*,vehicles(*),hosts(*)`,
          {
            headers: {
              'apikey': apiKey,
              'Authorization': `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch booking details');
        }

        const bookings = await response.json();
        if (bookings.length === 0) {
          throw new Error('Booking not found');
        }

        setBookingData(bookings[0]);
      } catch (err) {
        console.error('Error fetching booking:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchBookingDetails();
  }, [bookingId]);

  if (loading) {
    return (
      <div className="booking-success-page">
        <div className="success-card">
          <h1 className="title">Loading Booking Details...</h1>
          <p className="subtitle">Please wait while we fetch your booking information.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="booking-success-page">
        <div className="success-card">
          <h1 className="title" style={{ color: '#721c24' }}>Error Loading Booking</h1>
          <p className="subtitle">{error}</p>
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

  if (!bookingData) {
    return (
      <div className="booking-success-page">
        <div className="success-card">
          <h1 className="title">Booking Not Found</h1>
          <p className="subtitle">We couldn't find your booking details.</p>
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

  // Format dates for display
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
          <h2>{bookingData.vehicles?.make} {bookingData.vehicles?.model} ({bookingData.vehicles?.model_year})</h2>
          <p className="type">{bookingData.vehicles?.vehicle_type} • {bookingData.vehicles?.fuel_type} • {bookingData.vehicles?.transmission_type}</p>
          <p className="price">₹{bookingData.total_amount} • {bookingData.plan} Plan</p>
          <hr />
          <p>
            <strong>Pickup:</strong> {formatDateTime(bookingData.start_time)}
          </p>
          <p>
            <strong>Return:</strong> {formatDateTime(bookingData.end_time)}
          </p>
          <p>
            <strong>Location:</strong> {bookingData.vehicles?.location_name}, {bookingData.vehicles?.city}
          </p>
          <p>
            <strong>Host:</strong> {bookingData.vehicles?.hosts?.full_name}
          </p>
          {bookingData.booking_code && (
            <p>
              <strong>Booking Code:</strong> <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#007bff' }}>{bookingData.booking_code}</span>
            </p>
          )}
          {bookingData.vehicles?.buffer_hours && (
            <p style={{ fontSize: '12px', color: '#6c757d', marginTop: '10px' }}>
              <em>Note: Vehicle will be available for next booking after {bookingData.vehicles.buffer_hours} hours buffer time.</em>
            </p>
          )}
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
