

// components/UnifiedSearchBar.js
"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FaMapMarkerAlt, FaCalendarAlt, FaSearch, FaChevronDown } from "react-icons/fa";
import { toast } from "react-hot-toast";
import styles from "./SearchBar.module.css"; 

// Hardcoded city list for the Location dropdown
const CITIES = [
    "Chennai",
    "Bangalore",
    "Kochi",
    "Hyderbad",
    "Mumbai",
];

// Uniform placeholder for both location fields
const LOCATION_PLACEHOLDER = "Select Your Place";

export default function SearchBar() {
  const router = useRouter();
  
  // State for the Location selection (will display the city name or placeholder)
  const [location, setLocation] = useState(LOCATION_PLACEHOLDER); 
  // State for Pick Up (read-only placeholder)
  const [pickUpLocation] = useState(LOCATION_PLACEHOLDER); 

  const [pickupDate, setPickupDate] = useState(null);
  const [returnDate, setReturnDate] = useState(null);
  
  // State for managing the custom dropdown visibility
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  // Handle city selection from the custom dropdown
  const handleCitySelect = (city) => {
    setLocation(city);
    setIsDropdownOpen(false);
  };

  // Utility to format date for URL
  const formatDateTime = (date) => {
    // ... (formatDateTime function remains the same)
    if (!date) return "";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  const handleSearch = () => {
    // 1. Validation Checks
    if (location === LOCATION_PLACEHOLDER) {
      toast.error("Please select a Location city.");
      return;
    }
    
    if (!pickupDate || !returnDate) {
      toast.error("Please select both pick-up and return date & time.");
      return;
    }
    if (returnDate < pickupDate) {
      toast.error("Return date cannot be before pick-up date & time.");
      return;
    }

    // 2. Navigation
    const params = new URLSearchParams({
      location,
      pickUp: pickUpLocation, 
      pickupTime: formatDateTime(pickupDate),
      returnTime: formatDateTime(returnDate),
    });

    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className={styles.container}>
      <div className={styles.box} role="search" aria-label="Car and Location Search Bar">
        
        {/* 🏙️ 1. Location (Custom Dropdown) */}
        <div className={styles.field} ref={dropdownRef}>
          <label className={styles.label}>Location</label>
          <div 
            className={styles.inputWrapper}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            role="button"
            aria-expanded={isDropdownOpen}
            aria-controls="city-dropdown-list"
          > 
            {/* Display selected city or placeholder */}
            <div className={location === LOCATION_PLACEHOLDER ? styles.placeholderText : styles.selectedText}>
                {location}
            </div>
            <FaMapMarkerAlt className={styles.icon} aria-hidden="true" />
            <FaChevronDown className={`${styles.dropdownArrow} ${isDropdownOpen ? styles.arrowUp : ''}`} />
          </div>

          {/* Custom Dropdown List */}
          {isDropdownOpen && (
            <ul id="city-dropdown-list" className={styles.dropdownList}>
              {CITIES.map((city) => (
                <li 
                  key={city} 
                  className={styles.dropdownItem}
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent closing the menu instantly if clicking near the input
                    handleCitySelect(city);
                  }}
                >
                  {city}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Separator 1 */}
        <div className={styles.separator}></div>

        {/* 📍 2. Pick Up (Read-Only Placeholder) */}
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
        
        {/* Separator 2 & 3, Date Fields, and Search Button remain the same */}
        
        <div className={styles.separator}></div>

        {/* 📅 3. Pick-Up Date & Time */}
        <div className={styles.field}>
          <label htmlFor="pickupDate" className={styles.label}>Pick-Up Date & Time</label>
          <div className={styles.inputWrapper}>
            <FaCalendarAlt className={styles.icon} aria-hidden="true" />
            <DatePicker
              id="pickupDate"
              selected={pickupDate}
              onChange={(date) => {
                setPickupDate(date);
                if (returnDate && date && returnDate < date) setReturnDate(null);
              }}
              placeholderText="Select pick-up date & time"
              dateFormat="dd/MM/yyyy h:mm aa"
              showTimeSelect
              timeIntervals={30}
              minDate={today}
              className={styles.dateInput}
              onChangeRaw={(e) => e.preventDefault()}
            />
          </div>
        </div>
        
        <div className={styles.separator}></div>

        {/* 📆 4. Return Date & Time */}
        <div className={styles.field}>
          <label htmlFor="returnDate" className={styles.label}>Return Date & Time</label>
          <div className={styles.inputWrapper}>
            <FaCalendarAlt className={styles.icon} aria-hidden="true" />
            <DatePicker
              id="returnDate"
              selected={returnDate}
              onChange={(date) => setReturnDate(date)}
              placeholderText="Select return date & time"
              dateFormat="dd/MM/yyyy h:mm aa"
              showTimeSelect
              timeIntervals={30}
              minDate={pickupDate || today}
              className={styles.dateInput}
              onChangeRaw={(e) => e.preventDefault()}
            />
          </div>
        </div>
        
        {/* 🔍 Search Button (Circular) */}
        <button
          onClick={handleSearch}
          className={styles.searchButton}
          aria-label="Search"
        >
          <FaSearch aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}