"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import "./search.css";

// debounce helper
function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const city = searchParams.get("city");
  const pickup = searchParams.get("pickupTime");
  const returndate = searchParams.get("returnTime");

  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [filters, setFilters] = useState({
    type: "",
    fuel: "",
    transmission: "",
    seats: "",
    year: "",
  });

  // debounce filter values to reduce API spam
  const debouncedFilters = useDebounce(filters);

  // ---- get user location once ----
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

  // ---- fetch cars from Supabase via API ----
  useEffect(() => {
    async function fetchCars() {
      if (!city) return;
      setLoading(true);
      try {
        const params = new URLSearchParams({ city });
        Object.entries(debouncedFilters).forEach(([key, val]) => {
          if (val) params.append(key, val);
        });

        const res = await fetch(`/api/cars?${params.toString()}`, {
          cache: "no-store",
        });
        const data = await res.json();

        const enriched = data.map((car) => {
          if (userLocation && car.latitude && car.longitude) {
            car.distance_km = calcDistance(
              userLocation.lat,
              userLocation.lon,
              car.latitude,
              car.longitude
            );
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
  }, [city, userLocation, debouncedFilters]);

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

  return (
    <div className="search-results-page">
      <h1 className="results-title">Available Cars in {city}</h1>
      <p className="results-subtitle">
        Pick-up: {pickup} | Return: {returndate}
      </p>

      <div className="results-layout">
        {/* ==== Filter Sidebar ==== */}
        <aside className="filter-panel">
          <div className="filter-header">
            <h3>Filters</h3>
            <button
              className="clear-filters-btn"
              onClick={() =>
                setFilters({
                  type: "",
                  fuel: "",
                  transmission: "",
                  seats: "",
                  year: "",
                })
              }
            >
              Clear
            </button>
          </div>

          {[
            ["Vehicle Type", "type", ["SUV", "Sedan", "Hatchback"]],
            ["Fuel Type", "fuel", ["Petrol", "Diesel", "Electric"]],
            ["Transmission", "transmission", ["Manual", "Automatic"]],
            ["Seats", "seats", ["4", "5", "6", "7"]],
            ["Model Year", "year", ["2024", "2023", "2022", "2021"]],
          ].map(([label, key, options]) => (
            <div className="filter-group" key={key}>
              <label>{label}</label>
              <select
                className="filter-select"
                value={filters[key]}
                onChange={(e) =>
                  setFilters({ ...filters, [key]: e.target.value })
                }
              >
                <option value="">All</option>
                {options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </aside>

        {/* ==== Car Results ==== */}
        <div className="cars-grid">
          {loading ? (
            <>
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className="car-card skeleton-card">
                  <div className="skeleton skeleton-img"></div>
                  <div className="skeleton skeleton-line short"></div>
                  <div className="skeleton skeleton-line"></div>
                  <div className="skeleton skeleton-btn"></div>
                </div>
              ))}
            </>
          ) : cars.length === 0 ? (
            <p>No cars found in {city}.</p>
          ) : (
            cars.map((car) => (
              <div
                key={car.id}
                className="car-card"
                onClick={() =>
                  router.push(
                    `/car/${car.id}?pickup=${pickup}&return=${returndate}`
                  )
                }
                style={{ cursor: "pointer" }}
              >
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
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
