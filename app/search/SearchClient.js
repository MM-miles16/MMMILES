"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import "./search.css";

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const location = searchParams.get("location");
  const pickup = searchParams.get("pickup");
  const returndate = searchParams.get("return");

  const [cars, setCars] = useState([]);
  const [selectedCar, setSelectedCar] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const carData = [
      {
        id: 1,
        name: "Hyundai i20",
        type: "Hatchback",
        price: "₹2,000/day",
        img: "/cars/i20.jpg",
      },
      {
        id: 2,
        name: "Maruti Suzuki Dzire",
        type: "Sedan",
        price: "₹2,200/day",
        img: "/cars/dzire.jpg",
      },
      {
        id: 3,
        name: "Toyota Innova Crysta",
        type: "SUV",
        price: "₹3,500/day",
        img: "/cars/innova.jpg",
      },
      {
        id: 4,
        name: "Mahindra XUV700",
        type: "SUV",
        price: "₹4,000/day",
        img: "/cars/xuv700.jpg",
      },
    ];
    setCars(carData);
  }, []);

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
    // Redirect to booking success page with all info as query params
    const params = new URLSearchParams({
      name: selectedCar.name,
      type: selectedCar.type,
      price: selectedCar.price,
      location: location,
      pickup: pickup,
      return: returndate,
    });
    router.push(`/booking-success?${params.toString()}`);
  };

  return (
    <div className="search-results-page">
      <h1 className="results-title">Available Cars in {location}</h1>
      <p className="results-subtitle">
        Pick-up: {pickup} | Return: {returndate}
      </p>

      <div className="cars-grid">
        {cars.map((car) => (
          <div key={car.id} className="car-card">
            <Image
              src={car.img}
              alt={car.name}
              width={300}
              height={180}
              className="car-image"
            />
            <div className="car-info">
              <h3>{car.name}</h3>
              <p>{car.type}</p>
              <p className="price">{car.price}</p>
              <button
                className="book-btn"
                onClick={() => openBookingModal(car)}
              >
                Book Now
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ===== Booking Modal ===== */}
      {showModal && selectedCar && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="booking-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="close-btn" onClick={closeModal}>
              ✖
            </button>
            <div className="modal-content">
              <Image
                src={selectedCar.img}
                alt={selectedCar.name}
                width={400}
                height={240}
                className="modal-image"
              />
              <h2>{selectedCar.name}</h2>
              <p className="modal-type">{selectedCar.type}</p>
              <p className="modal-price">{selectedCar.price}</p>
              <div className="modal-summary">
                <p>
                  <strong>Location:</strong> {location}
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
