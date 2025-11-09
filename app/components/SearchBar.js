"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaSearch,
  FaChevronDown,
  FaCrosshairs,
  FaTimes,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import styles from "./SearchBar.module.css";

const CITIES = ["Chennai", "Bengaluru", "Kochi", "Hyderabad", "Mumbai"];
const LOCATION_PLACEHOLDER = "Select Your Place";

export default function SearchBar() {
  const router = useRouter();

  // Form state
  const [location, setLocation] = useState(LOCATION_PLACEHOLDER);
  const [pickupDate, setPickupDate] = useState(null);
  const [returnDate, setReturnDate] = useState(null);
  const [pickupHour, setPickupHour] = useState(9);
  const [returnHour, setReturnHour] = useState(17);

  // Location & manual search state
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [currentAddress, setCurrentAddress] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Manual search UI
  const [manualInput, setManualInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isSuggestLoading, setIsSuggestLoading] = useState(false);
  const [isSuggestOpen, setIsSuggestOpen] = useState(false);
  const skipNextSearchRef = useRef(false);
  const isRestoringRef = useRef(true);

  // UI state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const dropdownRef = useRef(null);
  const suggestRef = useRef(null);

  // Debounce & abort controller refs
  const debounceRef = useRef(null);
  const abortRef = useRef(null);

  // today is computed on client to avoid SSR/CSR hydration mismatch
  const [today, setToday] = useState(null);
  useEffect(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    setToday(d);
  }, []);

  useEffect(() => {
    const saved = sessionStorage.getItem("lastSearchParams");
    if (saved) {
      const params = new URLSearchParams(saved);
      const city = params.get("city");
      const lat = parseFloat(params.get("lat"));
      const lon = parseFloat(params.get("lon"));
      const address = params.get("address");
      const pickup = params.get("pickupTime");
      const drop = params.get("returnTime");

      if (city) setLocation(city);

      if (address) {
        // 🚫 Prevent manual search from firing again
        skipNextSearchRef.current = true;
        setManualInput(address);
        setCurrentAddress(address);
      }

      if (lat && lon) {
        setLatitude(lat);
        setLongitude(lon);
      }

      if (pickup)
        setPickupDate(
          new Date(pickup.split(" ")[0].split("/").reverse().join("-"))
        );
      if (drop)
        setReturnDate(
          new Date(drop.split(" ")[0].split("/").reverse().join("-"))
        );
    }

    // 🚫 Prevent any auto-search during restore
    setTimeout(() => {
      isRestoringRef.current = false;
    }, 500);
  }, []);

  // Close dropdown and suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (suggestRef.current && !suggestRef.current.contains(event.target)) {
        setIsSuggestOpen(false);
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

  // Get current GPS location (free). Shows loading state & handles errors.
  const handleUseMyLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      toast.error("Geolocation not supported by your browser.");
      return;
    }

    setIsLocating(true);
    setIsDetecting(true);
    setCurrentAddress("Detecting location…");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          setLatitude(lat);
          setLongitude(lon);

          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
            );
            if (res.ok) {
              const data = await res.json();
              const address = data.display_name || "Current Location";
              skipNextSearchRef.current = true;
              setManualInput(address); // auto-fill input field
              setCurrentAddress(address);
            } else {
              setManualInput("Current Location");
              setCurrentAddress("Current Location");
            }
          } catch (e) {
            console.error("Reverse geocode failed:", e);
            setManualInput("Current Location");
            setCurrentAddress("Current Location");
          }

          toast.success("Location detected!");
        } finally {
          setIsLocating(false);
          setIsDetecting(false);
        }
      },
      (err) => {
        console.error("Geolocation error:", err?.code, err?.message);
        setIsLocating(false);
        setIsDetecting(false);
        setCurrentAddress("");

        if (err && err.code === 1) {
          toast.error("Permission denied. Please allow GPS access in your browser.");
        } else if (err && err.code === 2) {
          toast.error("Position unavailable. Try again later or enable device location.");
        } else if (err && err.code === 3) {
          toast.error("Location request timed out. Try again.");
        } else {
          toast.error("Unable to fetch your location.");
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // Manual suggestions search (OpenStreetMap Nominatim)
  const fetchSuggestions = async (query) => {
    // Cancel previous inflight fetch
    if (abortRef.current) {
      abortRef.current.abort();
    }

    // Create new controller
    const controller = new AbortController();
    abortRef.current = controller;

    setIsSuggestLoading(true);
    setIsSearching(true);

    try {
      // Nominatim usage policy: throttle requests; we'll debounce on client
      const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=6&q=${encodeURIComponent(
        query
      )}`;

      const res = await fetch(url, { signal: controller.signal, headers: { "Accept-Language": "en" } });
      if (!res.ok) {
        setIsSuggestLoading(false);
        return;
      }
      const data = await res.json();
      setIsSuggestLoading(false);
      setIsSearching(false);
      setSuggestions(data || []);
      setIsSuggestOpen(true);
    } catch (e) {
      if (e.name === "AbortError") {
        // aborted — ignore
      } else {
        console.error("Suggestion fetch error", e);
        setIsSuggestLoading(false);
        setIsSearching(false);
      }
    }
  };

  useEffect(() => {
    // 🚫 Stop search completely if still restoring session data
    if (isRestoringRef.current) return;

    // 🚫 Skip once if this update came from GPS/session restore
    if (skipNextSearchRef.current) {
      skipNextSearchRef.current = false;
      return;
    }

    if (!manualInput || manualInput.length < 3) {
      setSuggestions([]);
      setIsSuggestOpen(false);
      if (abortRef.current) {
        abortRef.current.abort();
      }
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(manualInput);
    }, 400);

    return () => clearTimeout(debounceRef.current);
  }, [manualInput]);

  const handlePickSuggestion = (item) => {
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    const display = item.display_name;

    setLatitude(lat);
    setLongitude(lon);
    setCurrentAddress(display);

    // 🔒 prevent re-triggering useEffect fetch
    skipNextSearchRef.current = true;
    setManualInput(display);

    setIsSuggestOpen(false);
    setSuggestions([]);

    toast.success("Location set.");
  };

  const handleClearManual = () => {
    setManualInput("");
    setSuggestions([]);
    setIsSuggestOpen(false);
  };

  const handleSearch = () => {
    const missingFields = [];

    if (location === LOCATION_PLACEHOLDER) missingFields.push("City");
    if (!latitude || !longitude) missingFields.push("Location");
    if (!pickupDate) missingFields.push("Pick-Up Date");
    if (!returnDate) missingFields.push("Return Date");

    if (missingFields.length > 0) {
      toast.error(`Please fill the following: ${missingFields.join(", ")}`);
      return;
    }

    if (returnDate < pickupDate) {
      toast.error("Return date cannot be before pick-up date.");
      return;
    }

    const params = new URLSearchParams({
      city: location,
      pickupTime: formatDateTime(pickupDate, pickupHour),
      returnTime: formatDateTime(returnDate, returnHour),
      lat: latitude,
      lon: longitude,
      address: currentAddress,
    });

    sessionStorage.setItem("lastSearchParams", params.toString());
    router.push(`/search?${params.toString()}`);
  };

  return (
    <>
      <div className={styles.container}>
        <div className={styles.box} role="search" aria-label="Car and Location Search Bar">
          {/* City Dropdown */}
          <div className={styles.field} ref={dropdownRef}>
            <label className={styles.label}>City</label>
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

          {/* Manual Location Input + GPS */}
          <div className={styles.field} style={{ position: "relative" }} ref={suggestRef}>
            <label className={styles.label}>Your Location</label>
            <div className={styles.inputWrapper}>
              <input
                type="text"
                placeholder="Type area, landmark or click GPS"
                value={manualInput}
                onChange={(e) => {
                  setManualInput(e.target.value);
                  // clear currentAddress if user types new
                  if (e.target.value.trim() === "") {
                    setCurrentAddress("");
                    setLatitude(null);
                    setLongitude(null);
                  }
                }}
                onFocus={() => {
                  if (suggestions.length > 0) setIsSuggestOpen(true);
                }}
                className={styles.textInput}
                aria-label="Enter location manually"
                autoComplete="off"
              />

              {/* Conditionally show either Clear or Search icon */}
              {manualInput.trim().length > 0 ? (
                <button
                  onClick={handleClearManual}
                  className={styles.smallButton}
                  aria-label="Clear location input"
                  title="Clear"
                >
                  <FaTimes />
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (manualInput.trim().length >= 3) {
                      clearTimeout(debounceRef.current);
                      fetchSuggestions(manualInput);
                    } else {
                      toast("Type 3+ chars");
                    }
                  }}
                  className={styles.smallButton}
                  aria-label="Search location manually"
                  title="Search"
                >
                  <FaSearch />
                </button>
              )}

              {/* GPS button stays always visible */}
              <button
                onClick={handleUseMyLocation}
                className={styles.smallButton}
                disabled={isLocating}
                aria-label="Use current location"
                title={isLocating ? "Detecting location…" : "Detect my location"}
              >
                {isLocating ? <span className={styles.loadingText}>...</span> : <FaCrosshairs />}
              </button>
            </div>

            {isDetecting && (
              <div className={styles.progressText}>📍 Detecting your location...</div>
            )}

            {/* Suggestions dropdown */}
            {isSuggestOpen && (suggestions.length > 0 || isSuggestLoading) && (
              <ul className={styles.suggestionsList} role="listbox" aria-label="Location suggestions">
                {isSuggestLoading && (
                  <li className={styles.suggestionItemDisabled}>Searching…</li>
                )}
                {!isSuggestLoading && suggestions.length === 0 && (
                  <li className={styles.suggestionItemDisabled}>No results</li>
                )}
                {!isSuggestLoading &&
                  suggestions.map((s) => (
                    <li
                      key={s.place_id}
                      className={styles.suggestionItem}
                      onClick={() => handlePickSuggestion(s)}
                      role="option"
                      aria-selected={currentAddress === s.display_name}
                    >
                      <div className={styles.suggestionTitle}>{s.display_name}</div>
                      {/* optionally show type or country */}
                      <div className={styles.suggestionMeta}>
                        {s.type} {s.address?.country ? `• ${s.address.country}` : ""}
                      </div>
                    </li>
                  ))}
              </ul>
            )}

            {isSearching && !isDetecting && (
              <div className={styles.progressText}>🔍 Searching for places...</div>
            )}


          </div>

          <div className={styles.separator}></div>

          {/* Date Selector */}
          <div className={styles.field}>
            <label className={styles.label}>Pick-Up & Return</label>
            <div
              className={styles.inputWrapper}
              onClick={() => setIsModalOpen(true)}
              role="button"
              aria-haspopup="dialog"
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
                aria-label="Pick-up and return times"
              />
            </div>
          </div>

          <button onClick={handleSearch} className={styles.searchButton} aria-label="Search">
            <FaSearch aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Date Modal */}
      {isModalOpen && today && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modalContent}>
            <h3>Select Dates & Time</h3>

            <div className={styles.dateTimeSection}>
              <div className={styles.dateTimeBlock}>
                <label className={styles.modalLabel}>Pick-Up Date</label>
                <input
                  type="date"
                  value={pickupDate ? pickupDate.toISOString().split("T")[0] : ""}
                  min={today.toISOString().split("T")[0]}
                  onChange={(e) => {
                    const selected = new Date(e.target.value);
                    const now = new Date();
                    now.setHours(0, 0, 0, 0);
                    if (selected < now) {
                      toast.error("You can’t select a past date.");
                      return;
                    }
                    setPickupDate(selected);
                  }}
                  className={styles.datePickerInput}
                />
                <label className={styles.modalLabel}>Pick-Up Time: {pickupHour}:00</label>
                <input
                  type="range"
                  min="0"
                  max="23"
                  value={pickupHour}
                  onChange={(e) => setPickupHour(Number(e.target.value))}
                  className={styles.slider}
                />
              </div>

              <div className={styles.dateTimeBlock}>
                <label className={styles.modalLabel}>Return Date</label>
                <input
                  type="date"
                  value={returnDate ? returnDate.toISOString().split("T")[0] : ""}
                  min={pickupDate ? pickupDate.toISOString().split("T")[0] : today.toISOString().split("T")[0]}
                  onChange={(e) => {
                    const selected = new Date(e.target.value);
                    const now = new Date();
                    now.setHours(0, 0, 0, 0);
                    if (selected < now) {
                      toast.error("You can’t select a past date.");
                      return;
                    }
                    setReturnDate(selected);
                  }}
                  className={styles.datePickerInput}
                />
                <label className={styles.modalLabel}>Return Time: {returnHour}:00</label>
                <input
                  type="range"
                  min="0"
                  max="23"
                  value={returnHour}
                  onChange={(e) => setReturnHour(Number(e.target.value))}
                  className={styles.slider}
                />
              </div>
            </div>

            <div className={styles.modalButtons}>
              <button onClick={() => setIsModalOpen(false)} className={styles.cancelBtn}>
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