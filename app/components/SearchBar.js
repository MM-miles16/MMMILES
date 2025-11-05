"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaMapMarkerAlt, FaCalendarAlt, FaSearch, FaChevronDown } from "react-icons/fa";
import { toast } from "react-hot-toast";
import styles from "./SearchBar.module.css";

const CITIES = ["Chennai", "Bangalore", "Kochi", "Hyderabad", "Mumbai"];
const LOCATION_PLACEHOLDER = "Select Your Place";

export default function SearchBar() {
  const router = useRouter();
  const [location, setLocation] = useState(LOCATION_PLACEHOLDER);
  const [pickUpLocation] = useState(LOCATION_PLACEHOLDER);
  const [pickupDate, setPickupDate] = useState(null);
  const [returnDate, setReturnDate] = useState(null);
  const [pickupHour, setPickupHour] = useState(9);
  const [returnHour, setReturnHour] = useState(17);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const dropdownRef = useRef(null);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCitySelect = (city) => {
    setLocation(city);
    setIsDropdownOpen(false);
  };

  const formatDateTime = (date, hour) => {
    if (!date) return "";
    const d = new Date(date);
    d.setHours(hour, 0, 0, 0);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:00`;
  };

  const handleSearch = () => {
    if (location === LOCATION_PLACEHOLDER) {
      toast.error("Please select a location city.");
      return;
    }
    if (!pickupDate || !returnDate) {
      toast.error("Please select both pick-up and return date & time.");
      return;
    }
    if (returnDate < pickupDate) {
      toast.error("Return date cannot be before pick-up date.");
      return;
    }

    const params = new URLSearchParams({
      location,
      pickUp: pickUpLocation,
      pickupTime: formatDateTime(pickupDate, pickupHour),
      returnTime: formatDateTime(returnDate, returnHour),
    });
    router.push(`/search?${params.toString()}`);
  };

  return (
    <>
      <div className={styles.container}>
        <div className={styles.box} role="search" aria-label="Car and Location Search Bar">
          
          {/* Location */}
          <div className={styles.field} ref={dropdownRef}>
            <label className={styles.label}>Location</label>
            <div 
              className={styles.inputWrapper}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              role="button"
              aria-expanded={isDropdownOpen}
              aria-controls="city-dropdown-list"
            >
              <div className={location === LOCATION_PLACEHOLDER ? styles.placeholderText : styles.selectedText}>
                {location}
              </div>
              <FaMapMarkerAlt className={styles.icon} aria-hidden="true" />
              <FaChevronDown className={`${styles.dropdownArrow} ${isDropdownOpen ? styles.arrowUp : ""}`} />
            </div>
            {isDropdownOpen && (
              <ul id="city-dropdown-list" className={styles.dropdownList}>
                {CITIES.map((city) => (
                  <li
                    key={city}
                    className={styles.dropdownItem}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCitySelect(city);
                    }}
                  >
                    {city}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className={styles.separator}></div>

          {/* Pick Up */}
          <div className={styles.field}>
            <label className={styles.label}>Pick Up</label>
            <div className={styles.inputWrapper}>
              <input
                type="text"
                value={pickUpLocation}
                readOnly
                className={styles.readOnlyInput}
                aria-label="Pick up place"
              />
              <FaMapMarkerAlt className={styles.icon} aria-hidden="true" />
            </div>
          </div>

          <div className={styles.separator}></div>

          {/* Date Selector (opens modal) */}
          <div className={styles.field}>
            <label className={styles.label} >Pick-Up & Return</label>
            <div
              className={styles.inputWrapper}
              onClick={() => setIsModalOpen(true)}
            >
              <FaCalendarAlt className={styles.icon} aria-hidden="true" />
              <input
                type="text"
                readOnly
                value={
                  pickupDate && returnDate
                    ? `${formatDateTime(pickupDate, pickupHour)} → ${formatDateTime(returnDate, returnHour)}`
                    : "Select Dates & Time"
                }
                className={styles.readOnlyInput}
              />
            </div>
          </div>

          <button onClick={handleSearch} className={styles.searchButton} aria-label="Search">
            <FaSearch aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Modal Calendar */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Select Dates & Time</h3>

            <input
              type="date"
              value={pickupDate ? pickupDate.toISOString().split("T")[0] : ""}
              min={today.toISOString().split("T")[0]}
              onChange={(e) => setPickupDate(new Date(e.target.value))}
              className={styles.datePickerInput}
            />
            <input
              type="date"
              value={returnDate ? returnDate.toISOString().split("T")[0] : ""}
              min={pickupDate ? pickupDate.toISOString().split("T")[0] : today.toISOString().split("T")[0]}
              onChange={(e) => setReturnDate(new Date(e.target.value))}
              className={styles.datePickerInput}
            />

            <div className={styles.sliderRow}>
              <label>Pick-Up Hour: {pickupHour}:00</label>
              <input
                type="range"
                min="0"
                max="23"
                value={pickupHour}
                onChange={(e) => setPickupHour(Number(e.target.value))}
                className={styles.slider}
              />
            </div>

            <div className={styles.sliderRow}>
              <label>Return Hour: {returnHour}:00</label>
              <input
                type="range"
                min="0"
                max="23"
                value={returnHour}
                onChange={(e) => setReturnHour(Number(e.target.value))}
                className={styles.slider}
              />
            </div>

            <div className={styles.modalButtons}>
              <button
                onClick={() => setIsModalOpen(false)}
                className={styles.cancelBtn}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!pickupDate || !returnDate) {
                    toast.error("Select both start and end dates.");
                    return;
                  }
                  if (returnDate < pickupDate) {
                    toast.error("End date cannot be before start date.");
                    return;
                  }
                  setIsModalOpen(false);
                }}
                className={styles.confirmBtn}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
