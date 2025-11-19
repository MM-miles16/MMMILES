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
import { useCity } from "../context/CityContext";
import styles from "./SearchBar.module.css";

const CITIES = ["Chennai", "Bengaluru", "Kochi", "Hyderabad", "Mumbai"];
const LOCATION_PLACEHOLDER = "Select Your Place";

// Google Maps API configuration
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;

// Google Maps services - will be initialized when needed
let geocoder = null;
let isGoogleMapsLoaded = false;

// Initialize Google Maps services (similar to Google's example)
const initializeGoogleMapsServices = (map) => {
  if (typeof window !== "undefined" && window.google && window.google.maps) {
    geocoder = new window.google.maps.Geocoder();
    isGoogleMapsLoaded = true;
    return true;
  }
  return false;
};

// Load Google Maps JavaScript API with proper callback handling
const loadGoogleMapsAPI = () => {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }

    // Check if already loaded and services available
    if (window.google && window.google.maps && window.google.maps.Geocoder) {
      // Create a temporary map for service initialization
      const tempMap = new window.google.maps.Map(document.createElement('div'));
      if (initializeGoogleMapsServices(tempMap)) {
        resolve(true);
        return;
      }
    }

    // Check if script is already loading
    if (window.googleMapsLoading) {
      // Wait for existing loading to complete
      const checkLoaded = setInterval(() => {
        if (window.google && window.google.maps && window.google.maps.Geocoder) {
          clearInterval(checkLoaded);
          resolve(initializeGoogleMapsServices(new window.google.maps.Map(document.createElement('div'))));
        }
      }, 100);
      return;
    }

    if (!GOOGLE_MAPS_API_KEY) {
      console.error("Google Maps API key not configured");
      resolve(false);
      return;
    }

    window.googleMapsLoading = true;
    window.initGoogleMaps = () => {
      window.googleMapsLoading = false;
      const tempMap = new window.google.maps.Map(document.createElement('div'));
      const success = initializeGoogleMapsServices(tempMap);
      resolve(success);
    };
    
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&callback=initGoogleMaps&loading=async`;
    script.async = true;
    script.defer = true;
    
    script.onerror = () => {
      window.googleMapsLoading = false;
      resolve(false);
    };
    
    document.head.appendChild(script);
  });
};

export default function SearchBar() {
  const router = useRouter();
  const { setSelectedCity } = useCity();
  
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

  // Pre-load Google Maps API on component mount
  useEffect(() => {
    if (GOOGLE_MAPS_API_KEY && !isGoogleMapsLoaded) {
      loadGoogleMapsAPI().then((loaded) => {
        if (loaded) {
          console.log("Google Maps API loaded successfully");
        } else {
          console.warn("Google Maps API failed to load");
        }
      });
    }
  }, []);

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

      if (city) {
        setLocation(city);
        setSelectedCity(city); // Sync CityContext when restoring from sessionStorage
      }

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
    setSelectedCity(city); // Update context for TrendingSection
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

  // Format Google Maps address for better display - prioritize formatted_address
  const formatGoogleAddress = (result) => {
    if (!result) return "Current Location";
    
    // Use formatted_address as the primary source (this addresses the first issue)
    let formatted = result.formatted_address;
    
    // If formatted_address is not available, try to build it from components
    if (!formatted && result.address_components && result.address_components.length > 0) {
      const components = result.address_components;
      const streetNumber = components.find(comp => comp.types.includes('street_number'))?.long_name || '';
      const route = components.find(comp => comp.types.includes('route'))?.long_name || '';
      const locality = components.find(comp => comp.types.includes('locality'))?.long_name || '';
      const sublocality = components.find(comp => comp.types.includes('sublocality'))?.long_name || '';
      const sublocalityLevel1 = components.find(comp => comp.types.includes('sublocality_level_1'))?.long_name || '';
      const administrativeArea = components.find(comp => comp.types.includes('administrative_area_level_1'))?.long_name || '';
      
      // Build address from components
      let addressParts = [];
      
      if (streetNumber && route) {
        addressParts.push(`${streetNumber} ${route}`);
      } else if (route) {
        addressParts.push(route);
      }
      
      // Add locality information
      const localityInfo = sublocality || sublocalityLevel1 || locality;
      if (localityInfo && !addressParts.includes(localityInfo)) {
        addressParts.push(localityInfo);
      }
      
      if (administrativeArea && !addressParts.includes(administrativeArea)) {
        addressParts.push(administrativeArea);
      }
      
      formatted = addressParts.join(', ') || "Current Location";
    }
    
    return formatted || "Current Location";
  };

  // Helper function to extract city from Google Maps API response and auto-select from dropdown
  const extractAndSelectCity = (result) => {
    if (!result || !result.address_components) return;
    
    const components = result.address_components;
    
    // Try to find city/locality in the following order of preference
    const cityPriorityTypes = [
      'locality',           // Most specific city
      'sublocality',        // Sub-locality
      'sublocality_level_1', // Level 1 sub-locality
      'administrative_area_level_2' // District/County level
    ];
    
    // Extract city name from components
    let detectedCity = null;
    
    for (const type of cityPriorityTypes) {
      const component = components.find(comp => comp.types.includes(type));
      if (component && component.long_name) {
        detectedCity = component.long_name;
        break;
      }
    }
    
    // If no city found in priority types, try administrative_area_level_1
    if (!detectedCity) {
      const adminComponent = components.find(comp => 
        comp.types.includes('administrative_area_level_1')
      );
      if (adminComponent && adminComponent.long_name) {
        detectedCity = adminComponent.long_name;
      }
    }
    
    // Check if detected city matches any city in our CITIES array
    if (detectedCity) {
      const matchedCity = CITIES.find(city => 
        city.toLowerCase() === detectedCity.toLowerCase()
      );
      
      if (matchedCity && location !== matchedCity) {
        setLocation(matchedCity);
        if (setSelectedCity) setSelectedCity(matchedCity);
        toast.success(`City automatically set to ${matchedCity}`);
      }
    }
  };

  // Get current GPS location and reverse geocode with Google Maps
  const handleUseMyLocation = async () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      toast.error("Geolocation not supported by your browser.");
      return;
    }

    if (!GOOGLE_MAPS_API_KEY) {
      toast.error("Google Maps API key not configured. Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your environment variables.");
      return;
    }

    setIsLocating(true);
    setIsDetecting(true);
    setCurrentAddress("Detecting location…");

    // Load Google Maps API if not already loaded
    if (!isGoogleMapsLoaded) {
      const loaded = await loadGoogleMapsAPI();
      if (!loaded) {
        setIsLocating(false);
        setIsDetecting(false);
        setCurrentAddress("");
        toast.error("Failed to load Google Maps API. Please check your internet connection.");
        return;
      }
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setLatitude(lat);
        setLongitude(lon);

        // Use Google Maps Geocoder for reverse geocoding
        if (geocoder) {
          const latlng = { lat: lat, lng: lon };
          
          geocoder.geocode({ location: latlng }, (results, status) => {
            if (status === "OK") {
              if (results[0]) {
                const address = formatGoogleAddress(results[0]);
                skipNextSearchRef.current = true;
                setManualInput(address);
                setCurrentAddress(address);
                
                // Auto-select city from dropdown based on the detected location
                extractAndSelectCity(results[0]);
                
                toast.success("Location detected!");
              } else {
                setManualInput("Current Location");
                setCurrentAddress("Current Location");
                toast.error("No address found for this location.");
              }
            } else {
              console.error("Geocoder failed due to: " + status);
              setManualInput("Current Location");
              setCurrentAddress("Current Location");
              toast.error("Failed to get address for this location.");
            }
            setIsLocating(false);
            setIsDetecting(false);
          });
        } else {
          setManualInput("Current Location");
          setCurrentAddress("Current Location");
          setIsLocating(false);
          setIsDetecting(false);
          toast.error("Google Maps geocoder not available.");
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

  // Manual suggestions search using Google Places API
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
      if (!GOOGLE_MAPS_API_KEY) {
        setIsSuggestLoading(false);
        setIsSearching(false);
        toast.error("Google Maps API key not configured. Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your environment variables.");
        return;
      }

      // Load Google Maps API if not already loaded
      if (!isGoogleMapsLoaded) {
        const loaded = await loadGoogleMapsAPI();
        if (!loaded) {
          setIsSuggestLoading(false);
          setIsSearching(false);
          toast.error("Failed to load Google Maps API. Please check your internet connection.");
          return;
        }
      }

      if (!isGoogleMapsLoaded) {
        setIsSuggestLoading(false);
        setIsSearching(false);
        toast.error("Google Maps service not available. Please refresh the page and try again.");
        console.error("Google Maps not loaded:", { isGoogleMapsLoaded });
        return;
      }

      // Use the new Google Places AutocompleteSuggestion API (as of March 2025)
      const autocompleteRequest = {
        input: query,
        location: new google.maps.LatLng(20.5937, 78.9629), // Center of India
        radius: 100000, // 100km radius
        componentRestrictions: { country: 'in' },
        types: ['geocode']
      };

      google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(autocompleteRequest, async (suggestions, status) => {
        if (status === "OK" && suggestions && suggestions.length > 0) {
          // Get detailed information for each suggestion
          const detailedPromises = suggestions.slice(0, 6).map(async (suggestion) => {
            try {
              // Use the new Place API to get detailed information
              const place = new google.maps.places.Place({
                id: suggestion.placeId,
                location: suggestion.location
              });

              await place.fetchFields({
                fields: ['addressComponents', 'formattedAddress', 'location', 'types']
              });

              return {
                place_id: suggestion.placeId,
                display_name: suggestion.formatPrimaryText?.text || suggestion.formatSuggestion?.text || suggestion.placePredictionText?.text || suggestion.placeId,
                formatted_address: place.getFormattedAddress(),
                lat: place.getLocation().lat(),
                lon: place.getLocation().lng(),
                types: suggestion.types || [],
                primary_text: suggestion.formatPrimaryText?.text || '',
                secondary_text: suggestion.formatSecondaryText?.text || ''
              };
            } catch (error) {
              console.warn('Failed to get place details for:', suggestion.placeId, error);
              return {
                place_id: suggestion.placeId,
                display_name: suggestion.formatPrimaryText?.text || suggestion.formatSuggestion?.text || suggestion.placePredictionText?.text || suggestion.placeId,
                formatted_address: '',
                lat: 0,
                lon: 0,
                types: suggestion.types || [],
                primary_text: suggestion.formatPrimaryText?.text || '',
                secondary_text: suggestion.formatSecondaryText?.text || ''
              };
            }
          });

          Promise.all(detailedPromises).then((detailedResults) => {
            const validResults = detailedResults.filter(result => result.lat !== 0 && result.lon !== 0);
            
            setIsSuggestLoading(false);
            setIsSearching(false);
            setSuggestions(validResults);
            setIsSuggestOpen(true);
          });
        } else {
          setIsSuggestLoading(false);
          setIsSearching(false);
          setSuggestions([]);
          setIsSuggestOpen(true);
          
          // Show helpful message if no predictions found
          if (status === "ZERO_RESULTS") {
            // Silent - no toast for zero results
          } else {
            console.error("Autocomplete status:", status);
          }
        }
      });
    } catch (e) {
      if (e.name === "AbortError") {
        // aborted — ignore
      } else {
        console.error("Suggestion fetch error", e);
        setIsSuggestLoading(false);
        setIsSearching(false);
        toast.error("Failed to search locations. Please try again.");
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

  const handlePickSuggestion = async (item) => {
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    const display = item.display_name || item.formatted_address;

    setLatitude(lat);
    setLongitude(lon);
    setCurrentAddress(display);

    // 🔒 prevent re-triggering useEffect fetch
    skipNextSearchRef.current = true;
    setManualInput(display);

    // Get detailed place information to extract city for auto-selection
    if (isGoogleMapsLoaded && item.place_id) {
      try {
        // Use the new Place API to get detailed information
        const place = new google.maps.places.Place({
          id: item.place_id,
          latLng: item.lat && item.lon ? new google.maps.LatLng(item.lat, item.lon) : undefined
        });

        place.fetchFields({
          fields: ['addressComponents', 'formattedAddress', 'location']
        }).then(() => {
          // Auto-select city from dropdown based on the selected location
          const placeData = {
            address_components: place.getAddressComponents().map(comp => ({
              long_name: comp.longText?.text || '',
              types: comp.types
            }))
          };
          extractAndSelectCity(placeData);
          
          // Update address with formatted address if available
          const formattedAddress = place.getFormattedAddress();
          if (formattedAddress && formattedAddress !== display) {
            setCurrentAddress(formattedAddress);
            setManualInput(formattedAddress);
          }
        }).catch((error) => {
          console.warn('Failed to fetch place details for city auto-selection:', error);
        });
      } catch (error) {
        console.warn('Failed to create Place object for city auto-selection:', error);
      }
    }

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
                  onClick={async () => {
                    if (manualInput.trim().length >= 3) {
                      clearTimeout(debounceRef.current);
                      await fetchSuggestions(manualInput);
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
                      aria-selected={currentAddress === s.display_name || currentAddress === s.formatted_address}
                    >
                      <div className={styles.suggestionTitle}>{s.display_name || s.formatted_address}</div>
                      {/* Show type information */}
                      <div className={styles.suggestionMeta}>
                        {s.types && s.types.length > 0 ? s.types[0].replace(/_/g, ' ') : ''} 
                        {s.secondary_text ? ` • ${s.secondary_text}` : ""}
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
                      toast.error("You can't select a past date.");
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
                      toast.error("You can't select a past date.");
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