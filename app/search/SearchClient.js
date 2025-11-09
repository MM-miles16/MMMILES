"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import "./search.css";

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const city = searchParams.get("city");
  const pickup = searchParams.get("pickupTime");
  const returndate = searchParams.get("returnTime");

  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCar, setSelectedCar] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  // ---- get user location ----
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
          });
        },
        () => setUserLocation(null),
        { enableHighAccuracy: true }
      );
    }
  }, []);

  // ---- fetch cars from API ----
  useEffect(() => {
    async function fetchCars() {
      if (!city) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/cars?city=${encodeURIComponent(city)}`);
        const data = await res.json();

        const enriched = data.map((car) => {
          if (userLocation) {
            car.distance_km = calcDistance(
              userLocation.lat,
              userLocation.lon,
              car.latitude,
              car.longitude
            );
          } else {
            car.distance_km = null;
          }
          return car;
        });
        setCars(enriched);
      } catch (e) {
        console.error("Error fetching cars:", e);
        setCars([]);
      } finally {
        setLoading(false);
      }
    }

    fetchCars();
  }, [city, userLocation]);

  // ---- distance math ----
  function calcDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
  }

  // ---- modal controls ----
  const openBookingModal = (car) => {
    setSelectedCar(car);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedCar(null);
  };

  const confirmBooking = () => {
    if (!selectedCar) return;
    const params = new URLSearchParams({
      name: `${selectedCar.make} ${selectedCar.model}`,
      type: selectedCar.vehicle_type,
      price: selectedCar.hourly_rate,
      location: city,
      pickup,
      return: returndate,
    });
    router.push(`/booking-success?${params.toString()}`);
  };

  // ---- UI ----
  if (loading)
    return (
      <div className="search-results-page">
        <h1 className="results-title">Searching cars in {city}...</h1>
      </div>
    );

  return (
    <div className="search-results-page">
      <h1 className="results-title">Available Cars in {city}</h1>
      <p className="results-subtitle">
        Pick-up: {pickup} | Return: {returndate}
      </p>

      <div className="cars-grid">
        {cars.length === 0 ? (
          <p>No cars found in {city}.</p>
        ) : (
          cars.map((car) => (
            <div key={car.id} className="car-card">
              <Image
                src={"/cars/default.jpg"}
                alt={`${car.make} ${car.model}`}
                width={300}
                height={180}
                className="car-image"
              />
              <div className="car-info">
                <h3>{car.make + " " + car.model}</h3>
                <p>{car.vehicle_type}</p>
                <p className="price">₹{car.hourly_rate}/hr</p>
                {car.distance_km && (
                  <p className="distance">📍 {car.distance_km} km away</p>
                )}
                <button
                  className="book-btn"
                  onClick={() => openBookingModal(car)}
                >
                  Book Now
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && selectedCar && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="booking-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={closeModal}>
              ✖
            </button>
            <div className="modal-content">
              <Image
                src={"/cars/default.jpg"}
                alt={`${selectedCar.make} ${selectedCar.model}`}
                width={400}
                height={240}
                className="modal-image"
              />
              <h2>{selectedCar.make + " " + selectedCar.model}</h2>
              <p className="modal-type">{selectedCar.vehicle_type}</p>
              <p className="modal-price">₹{selectedCar.hourly_rate}/hr</p>
              {selectedCar.distance_km && (
                <p>Distance: {selectedCar.distance_km} km</p>
              )}
              <div className="modal-summary">
                <p>
                  <strong>Location:</strong> {city}
                </p>
                <p>
                  <strong>Pick-up:</strong> {pickup}
                </p>
                <p>
                  <strong>Return:</strong> {returndate}
                </p>
              </div>
              <button className="confirm-btn" onClick={confirmBooking}>
                Confirm Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
