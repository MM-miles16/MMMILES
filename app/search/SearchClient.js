"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { toast } from "react-hot-toast";
import { formatINR, perPerson, tripPrice } from "../../lib/tripPrice";
import { FaFilter, FaSearch, FaMapMarkerAlt, FaClock, FaCar, FaGasPump, FaCog, FaUsers, FaCalendarAlt, FaChevronDown, FaStar, FaMedal, FaAirFreshener, FaAirbnb, FaSafari, FaFirstAid, FaUserFriends, FaChair, FaRegSave, FaSatellite, FaPhone, FaHeart, FaRegHeart, FaCrown, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import styles from "./filters.module.css";
import LocationPickerModal from "../components/LocationPickerModal";
import CalendarModal from "../components/CalendarModal";
import Skeleton from "../components/Skeleton";
import EmptyState from "../components/EmptyState";

// debounce helper
function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}

// Enforce Chennai/Coimbatore-only logic
function useCityEnforcement() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const city = searchParams.get("city");
    if (city && city !== "Chennai" && city !== "Coimbatore") {
      router.push(`/comingsoon?city=${encodeURIComponent(city)}`);
    }
  }, [searchParams, router]);
}

// Supabase storage base URL for car images
const STORAGE_BASE_URL = "/api/sb/storage/v1/object/public/car-images/";

// Helper to get ALL image URLs
function getCarImages(car) {
  const images = car.vehicle_images || [];
  // Sort by is_primary to ensure primary image is first for search results
  const sortedImages = [...images].sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0));
  
  if (sortedImages.length === 0) return ["/cars/default.jpg"];
  
  return sortedImages.map(img => {
      return img.image_url?.startsWith("http") 
        ? img.image_url 
        : `${STORAGE_BASE_URL}${img.image_url}`;
  });
}

function CarCard({ car, pickup, returndate, router, city }) {
  const [currentImgIdx, setCurrentImgIdx] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false); // Local state for now
  
  const images = getCarImages(car);

  const handleNextImg = (e) => {
    e.stopPropagation();
    setCurrentImgIdx((prev) => (prev + 1) % images.length);
  };

  const handlePrevImg = (e) => {
    e.stopPropagation();
    setCurrentImgIdx((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleWishlist = (e) => {
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
    // TODO: Call API to toggle wishlist
  };

  // All-in trip price (same calculation as checkout, incl. weekend rate) and the friends split.
  // Falls back to a 1-day weekday price if the dates are missing or shorter than the 6-hour minimum.
  const trip = tripPrice(car.base_daily_rate, pickup, returndate);
  const tripTotal = trip?.total;
  const split = tripTotal && perPerson(tripTotal, car.seating_capacity);

  return (
    <div
      className={styles.card}
      onClick={() =>
        router.push(
          `/car/${car.id}?pickup=${pickup}&return=${returndate}`
        )
      }
    >
      
      {/* 1. Image Section with Info Overlay */}
      <div className={styles.cardImageWrapper}>
        <Image
          src={images[currentImgIdx]}
          alt={`${car.make} ${car.model}`}
          width={400} 
          height={250}
          className={styles.carImg}
          priority={false} 
        />
        
        {/* Gradient overlay */}
        <div className={styles.gradientOverlay}></div>
        
        {/* Slider Arrows (Only if > 1 image) */}
        {images.length > 1 && (
          <>
            <button className={`${styles.sliderArrow} ${styles.leftArrow}`} onClick={handlePrevImg}>
              <FaChevronLeft size={12} color="#fff" />
            </button>
            <button className={`${styles.sliderArrow} ${styles.rightArrow}`} onClick={handleNextImg}>
              <FaChevronRight size={12} color="#fff" />
            </button>
          </>
        )}



        {/* Info Overlay - Title, Details, Rating */}
        <div className={styles.cardInfoOverlay}>
          <div className={styles.cardInfoLeft}>
            {/* Dots */}
            {images.length > 1 && (
              <div className={styles.dotsOverlay} style={{position: 'static', transform: 'none', marginBottom: '6px'}}>
                {images.map((_, idx) => (
                  <div key={idx} className={idx === currentImgIdx ? styles.dotActive : styles.dot}></div>
                ))}
              </div>
            )}
            <h3 className={styles.carTitle}>
              {car.make} {car.model} 
            </h3>
            <p className={styles.carSubtitle}>
              {car.model_year} <span className={styles.dotSeparator}></span> {car.fuel_type} <span className={styles.dotSeparator}></span> {car.transmission_type}
            </p>
          </div>
          
          <div className={styles.cardInfoRight}>
            <div className={styles.ratingPill}>
              <FaStar color="#f59e0b" size={10} /> {car.rating ? car.rating : 'New'}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Footer Section */}
      <div className={styles.cardFooter}>
        <div className={styles.footerLeft}>
          <span className={styles.featureTag}>
            <img src="/icons/location-icon.png" alt="loc" />
            {car.distance_km ? `${car.distance_km} km away` : `in ${city}`}
          </span>
        </div>

        <div className={styles.footerRight}>
          {tripTotal && (
            <>
              <div className={styles.priceRow}>
                <span className={styles.priceHour}>{formatINR(tripTotal)}</span>
                <span className={styles.priceUnit}>{trip.isTrip ? "total" : "/day"}</span>
              </div>
              <div className={styles.priceSplit}>
                {formatINR(split.each)} each for {split.people}
              </div>
            </>
          )}
        </div>
      </div>

    </div>
  );
}

// Helper to calculate distance
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

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Expanded tabs state
  const [expandedTabs, setExpandedTabs] = useState({
    price: true,
    details: true,
    seats: true,
    brand: false, // collapsed by default
  });

  const city = searchParams.get("city");
  const pickup = searchParams.get("pickupTime");
  const returndate = searchParams.get("returnTime");

  // Extract coordinates and address from URL parameters (sent from SearchBar)
  const userLat = searchParams.get("lat");
  const userLon = searchParams.get("lon");
  const currentAddress = searchParams.get("address") || "";

  // Location picker modal state
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  
  // Calendar modal state
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [pickupDate, setPickupDate] = useState(null);
  const [returnDate, setReturnDate] = useState(null);
  const [pickupHour, setPickupHour] = useState(9);
  const [returnHour, setReturnHour] = useState(17);

  // Validate URL parameters on mount
  useEffect(() => {
    if (pickup && returndate) {
        const parts = pickup.split(' ');
        const returnParts = returndate.split(' ');
        
        // Helper to parse "DD/MM/YYYY HH:MM"
        const parseDateTime = (str) => {
            const [dateStr, timeStr] = str.split(' ');
            const [day, month, year] = dateStr.split('/');
            const [hour, _] = timeStr.split(':');
            return new Date(year, month - 1, day, hour, 0);
        };

        const startDate = parseDateTime(pickup);
        const endDate = parseDateTime(returndate);
        const now = new Date();
        
        // Allow a small buffer (e.g., 5 mins) for "past" checks to avoid edge cases with clock diffs
        const pastBuffer = 5 * 60 * 1000; 

        if (startDate < new Date(now.getTime() - pastBuffer)) {
             toast.error("Pickup time cannot be in the past.");
             // Optional: Redirect or just clear params. 
             // Redirecting to home is safer to force re-selection.
             setTimeout(() => router.push('/'), 2000);
             return;
        }

        const durationMs = endDate - startDate;
        const minDurationMs = 6 * 60 * 60 * 1000; // 6 hours

        if (durationMs < minDurationMs) {
             toast.error("Minimum booking duration is 6 hours.");
             setTimeout(() => router.push('/'), 2000);
             return;
        }
    }
  }, [pickup, returndate, router]);

  // Initialize calendar state from URL params
  useEffect(() => {
    if (pickup) {
      // Parse DD/MM/YYYY HH:MM format
      const parts = pickup.split(' ');
      if (parts.length >= 2) {
        const datePart = parts[0].split('/');
        const timePart = parts[1].split(':');
        if (datePart.length === 3) {
          const date = new Date(
            parseInt(datePart[2]), // year
            parseInt(datePart[1]) - 1, // month (0-indexed)
            parseInt(datePart[0]), // day
            parseInt(timePart[0]) || 9, // hour
            0 // minutes always 0
          );
          setPickupDate(date);
          setPickupHour(parseInt(timePart[0]) || 9);
        }
      }
    }
    if (returndate) {
      const parts = returndate.split(' ');
      if (parts.length >= 2) {
        const datePart = parts[0].split('/');
        const timePart = parts[1].split(':');
        if (datePart.length === 3) {
          const date = new Date(
            parseInt(datePart[2]),
            parseInt(datePart[1]) - 1,
            parseInt(datePart[0]),
            parseInt(timePart[0]) || 17,
            0
          );
          setReturnDate(date);
          setReturnHour(parseInt(timePart[0]) || 17);
        }
      }
    }
  }, [pickup, returndate]);

    /* ------------------- UNIFIED FILTER STATE ------------------- */
  // 'filters' is the ONE source of truth.
  const [filters, setFilters] = useState({
    type: "",
    fuel: "",
    transmission: "",
    seats: "",
    year: "",
    brand: "",
    price: { min: 0, max: 2000 }, // Object structure
    gps: false,
    ac: false,
  });

  // 'pendingFilters' is used for MOBILE interaction only. 
  const [pendingFilters, setPendingFilters] = useState(filters);

  // Sync pending filters when main filters change
  useEffect(() => {
    setPendingFilters(filters);
  }, [filters]);

  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [brands, setBrands] = useState([]);
  // Price filter works on the all-in trip price shown on the cards; the range is set from the results
  const [priceRange, setPriceRange] = useState({ min: 0, max: 2000 });
  const priceTouched = useRef(false);
  const tripTotalOf = (car) => tripPrice(car.base_daily_rate, pickup, returndate)?.total;
  const [showFilters, setShowFilters] = useState(false); // Start closed on mobile
  const [isMobile, setIsMobile] = useState(false);

  // Handle Resize for logic switching
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 900;
      setIsMobile(mobile);
      if (!mobile) setShowFilters(true); // Force show on desktop
      else setShowFilters(false); // Hide by default on mobile load/transition
    };
    
    // Initial check
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Hide global footer on this page only
  useEffect(() => {
    document.body.classList.add('hide-footer');
    return () => {
      document.body.classList.remove('hide-footer');
    };
  }, []);

  // Helper to update state based on device type
  const updateFilter = (key, value) => {
    if (isMobile) {
      setPendingFilters(prev => ({ ...prev, [key]: value }));
    } else {
      setFilters(prev => ({ ...prev, [key]: value }));
    }
  };

  const updatePrice = (newPriceObj) => {
    if (isMobile) {
      setPendingFilters(prev => ({ ...prev, price: newPriceObj }));
    } else {
      setFilters(prev => ({ ...prev, price: newPriceObj }));
    }
  };

  const handleMinPrice = (val) => {
    priceTouched.current = true;
    const currentMax = isMobile ? pendingFilters.price.max : filters.price.max;
    const newMin = Math.min(val, currentMax - 100);
    updatePrice({ min: newMin, max: currentMax });
  };

  const handleMaxPrice = (val) => {
    priceTouched.current = true;
    const currentMin = isMobile ? pendingFilters.price.min : filters.price.min;
    const newMax = Math.max(val, currentMin + 100);
    updatePrice({ min: currentMin, max: newMax });
  };

  const debouncedFilters = useDebounce(filters, 500);
  // Price is filtered here on the client (all-in trip price), so it doesn't trigger a refetch
  const { price: _clientSidePrice, ...serverFilters } = debouncedFilters;
  const serverFiltersKey = JSON.stringify(serverFilters);

  const applyMobileFilters = () => {
    setFilters(pendingFilters);
    setShowFilters(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetFilters = () => {
    priceTouched.current = false;
    const resetState = {
      type: "",
      fuel: "",
      transmission: "",
      seats: "",
      year: "",
      brand: "",
      price: priceRange,
      gps: false,
      ac: false,
    };
    setFilters(resetState);
    setPendingFilters(resetState);
  };

  // Prepare user coordinates from URL parameters
  const userLocation = userLat && userLon ? {
    lat: parseFloat(userLat),
    lon: parseFloat(userLon)
  } : null;

  const isValidLocation = userLocation &&
    !isNaN(userLocation.lat) &&
    !isNaN(userLocation.lon) &&
    userLocation.lat !== 0 &&
    userLocation.lon !== 0;

  const searchAddress = searchParams.get("address");
  const displayLocation = searchAddress || city;

  useEffect(() => {
    async function fetchCars() {
      if (!city) return;
      setLoading(true);

      try {
        const params = new URLSearchParams({ city });
        if (pickup) params.append("pickupTime", pickup);
        if (returndate) params.append("returnTime", returndate);

        Object.entries(serverFilters).forEach(([key, val]) => {
          if (val && val !== false) {
            params.append(key, val.toString());
          }
        });

        const res = await fetch(`/api/cars?${params.toString()}`, {
          cache: "no-store",
        });

        if (!res.ok) throw new Error(`API returned ${res.status}`);

        const data = await res.json();
        const enriched = data.map((car) => {
          if (isValidLocation && car.latitude && car.longitude) {
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
        const uniqueBrands = [...new Set(data.map(car => car.make).filter(Boolean))].sort();
        setBrands(uniqueBrands);

        // Slider range = 0 … highest all-in trip price in these results (rounded up to ₹500)
        const totals = enriched.map(tripTotalOf).filter(Boolean);
        const maxTotal = totals.length ? Math.ceil(Math.max(...totals) / 500) * 500 : 2000;
        setPriceRange({ min: 0, max: maxTotal });
        if (!priceTouched.current) {
          setFilters((prev) => ({ ...prev, price: { min: 0, max: maxTotal } }));
        }

      } catch (e) {
        console.error("Error fetching cars:", e);
        setCars([]);
      } finally {
        setLoading(false);
      }
    }

    fetchCars();
  }, [city, userLat, userLon, serverFiltersKey, pickup, returndate]);

  const uiFilters = isMobile ? pendingFilters : filters;

  // Cars within the selected all-in price range (same number the cards show)
  const visibleCars = cars.filter((car) => {
    const total = tripTotalOf(car);
    return total == null || (total >= filters.price.min && total <= filters.price.max);
  });
  const priceIsFiltered = filters.price.min > priceRange.min || filters.price.max < priceRange.max;

  const handleLocationSelect = (location) => {
    const newCity = location.city || city;
    
    if (newCity && newCity !== "Chennai" && newCity !== "Coimbatore") {
      router.push(`/comingsoon?city=${encodeURIComponent(newCity)}`);
      return;
    }

    const params = new URLSearchParams({
      city: newCity,
      pickupTime: pickup,
      returnTime: returndate,
      lat: location.lat,
      lon: location.lon,
      address: location.address,
    });
    sessionStorage.setItem("lastSearchParams", params.toString());
    router.push(`/search?${params.toString()}`);
  };

  const handleDateSelect = (newPickupDate, newReturnDate, newPickupHour, newReturnHour) => {
    const formatDateTime = (date, hour) => {
      const d = new Date(date);
      const day = d.getDate().toString().padStart(2, '0');
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const year = d.getFullYear();
      const hourStr = hour.toString().padStart(2, '0');
      return `${day}/${month}/${year} ${hourStr}:00`;
    };
    const newPickup = formatDateTime(newPickupDate, newPickupHour);
    const newReturn = formatDateTime(newReturnDate, newReturnHour);
    const params = new URLSearchParams({
      city: city,
      pickupTime: newPickup,
      returnTime: newReturn,
      lat: userLat || '',
      lon: userLon || '',
      address: currentAddress,
    });
    sessionStorage.setItem("lastSearchParams", params.toString());
    router.push(`/search?${params.toString()}`);
  };

  const formatDateForDisplay = (dateStr) => {
    if (!dateStr) return { date: '--', time: '--' };
    const parts = dateStr.split(' ');
    if (parts.length < 2) return { date: dateStr, time: '' };
    const datePart = parts[0];
    const timePart = parts[1];
    const dateParts = datePart.split('/');
    if (dateParts.length !== 3) return { date: dateStr, time: '' };
    const day = parseInt(dateParts[0]);
    const month = parseInt(dateParts[1]) - 1;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const hour = parseInt(timePart.split(':')[0]);
    const displayHour = hour === 0 ? '12AM' : hour === 12 ? '12PM' : hour > 12 ? `${hour - 12}PM` : `${hour}AM`;
    return { date: `${day} ${months[month]}`, time: displayHour };
  };

  const pickupDisplay = formatDateForDisplay(pickup);
  const returnDisplay = formatDateForDisplay(returndate);
  const displayAddress = currentAddress 
    ? (currentAddress.length > 40 ? currentAddress.substring(0, 40) + '...' : currentAddress)
    : (city ? city : 'Select Location');

  return (
    <div className={styles.container}>
      <LocationPickerModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onLocationSelect={handleLocationSelect}
        currentAddress={currentAddress}
      />

      {isCalendarOpen && (
        <CalendarModal
          isOpen={isCalendarOpen}
          onClose={() => setIsCalendarOpen(false)}
          initialPickupDate={pickupDate}
          initialReturnDate={returnDate}
          onApply={(start, end) => {
            const startHour = start.getHours();
            const endHour = end.getHours();
            handleDateSelect(start, end, startHour, endHour);
          }}
        />
      )}

      {/* Top Bar - Zoomcar Style */}
      <div className={styles.searchTopBar}>
        <div 
          className={styles.searchLocation} 
          onClick={() => setIsLocationModalOpen(true)}
          role="button"
          tabIndex={0}
        >
          <div className={styles.locationIconCircle}>
            <FaMapMarkerAlt className={styles.locationIcon} />
          </div>
          <span className={styles.locationText}>{displayAddress}</span>
        </div>

        <div className={styles.searchDates}>
          <div className={styles.dateBlock} onClick={() => setIsCalendarOpen(true)} role="button" tabIndex={0}>
            <div className={styles.dateValue}>{pickupDisplay.date}</div>
            <div className={styles.timeValue}>{pickupDisplay.time}</div>
          </div>
          <div className={styles.dateBlock} onClick={() => setIsCalendarOpen(true)} role="button" tabIndex={0}>
            <div className={styles.dateValue}>{returnDisplay.date}</div>
            <div className={styles.timeValue}>{returnDisplay.time}</div>
          </div>
        </div>
      </div>

      <div className={styles.main}>
        <button className={styles.mobileFilterToggle} onClick={() => setShowFilters(!showFilters)}>
          <FaFilter /> {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>

        <aside className={styles.sidebar} style={{ display: showFilters ? undefined : 'none' }}>
            <div className={styles.filtersContainer}>
              <div className={styles.filtersHeader}>
                {isMobile && (
                  <button className={styles.closeBtn} onClick={() => setShowFilters(false)}>✕</button>
                )}
                <span style={{ marginRight: 'auto', marginLeft: isMobile ? '12px' : '0' }}>Filters</span>
                <button className={styles.reset} onClick={resetFilters}>Reset All</button>
              </div>

              <div className={styles.filtersTabs}>
                {/* Price Tab */}
                <div className={styles.tab}>
                  <div className={styles.tabHeader} onClick={() => setExpandedTabs(p => ({...p, price: !p.price}))}>
                    <span>Trip price (all-in)</span>
                    <FaChevronDown style={{ transform: expandedTabs.price ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                  </div>
                  <div className={`${styles.tabContent} ${expandedTabs.price ? styles.open : ''}`}>
                    <div className={styles.rangeWrapper}>
                      <div className={styles.rangeLabels}><span>Min Price</span><span>Max Price</span></div>
                      <div className={styles.priceRange}>
                         <div className={styles.rangeTrack} style={{ "--min": ((uiFilters.price.min / priceRange.max) * 100), "--max": ((uiFilters.price.max / priceRange.max) * 100) }}></div>
                         <input type="range" min={priceRange.min} max={priceRange.max} step={100} value={uiFilters.price.min} className={styles.rangeInput} aria-label="Minimum trip price" onChange={(e) => handleMinPrice(parseInt(e.target.value))} />
                         <input type="range" min={priceRange.min} max={priceRange.max} step={100} value={uiFilters.price.max} className={styles.rangeInput} aria-label="Maximum trip price" onChange={(e) => handleMaxPrice(parseInt(e.target.value))} />
                      </div>
                      <div className={styles.priceValues}><span>{formatINR(uiFilters.price.min)}</span><span>{formatINR(uiFilters.price.max)}</span></div>
                    </div>
                  </div>
                </div>

                {/* Car Details Tab */}
                <div className={styles.tab}>
                   <div className={styles.tabHeader} onClick={() => setExpandedTabs(p => ({...p, details: !p.details}))}>
                    <span>Car Details</span>
                    <FaChevronDown style={{ transform: expandedTabs.details ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                  </div>
                  <div className={`${styles.tabContent} ${expandedTabs.details ? styles.open : ''}`}>
                    <div className={styles.categorySection}>
                      <div className={styles.categoryTitle}>Filter By Car Type</div>
                      <div className={styles.checkboxGroup}>
                        {["SUV", "Compact SUV", "Luxury SUV", "Hatchback", "MUV", "Sedan"].map((type) => (
                          <label key={type} className={styles.checkboxLabel}>
                            <input type="checkbox" className={styles.checkboxInput} checked={uiFilters.type === type} onChange={() => updateFilter("type", uiFilters.type === type ? "" : type)} />
                            <span className={styles.checkboxText}>{type}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className={styles.categorySection}>
                      <div className={styles.categoryTitle}>Filter By Transmission</div>
                      <div className={styles.checkboxGroup}>
                         {["Manual", "Automatic"].map((trans) => (
                          <label key={trans} className={styles.checkboxLabel}>
                            <input type="checkbox" className={styles.checkboxInput} checked={uiFilters.transmission === trans} onChange={() => updateFilter("transmission", uiFilters.transmission === trans ? "" : trans)} />
                            <span className={styles.checkboxText}>{trans}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className={styles.categorySection}>
                      <div className={styles.categoryTitle}>Filter By Fuel Type</div>
                      <div className={styles.checkboxGroup}>
                        {["Petrol", "Diesel", "Electric", "Hybrid"].map((fuel) => (
                          <label key={fuel} className={styles.checkboxLabel}>
                            <input type="checkbox" className={styles.checkboxInput} checked={uiFilters.fuel === fuel} onChange={() => updateFilter("fuel", uiFilters.fuel === fuel ? "" : fuel)} />
                            <span className={styles.checkboxText}>{fuel}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Seats Tab */}
                <div className={styles.tab}>
                   <div className={styles.tabHeader} onClick={() => setExpandedTabs(p => ({...p, seats: !p.seats}))}>
                    <span>Seats</span>
                    <FaChevronDown style={{ transform: expandedTabs.seats ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                  </div>
                  <div className={`${styles.tabContent} ${expandedTabs.seats ? styles.open : ''}`}>
                    <div className={styles.checkboxGroup}>
                       {["5 seater", "7 seater", "8 seater"].map((seat) => (
                          <label key={seat} className={styles.checkboxLabel}>
                            <input type="checkbox" className={styles.checkboxInput} checked={uiFilters.seats === seat} onChange={() => updateFilter("seats", uiFilters.seats === seat ? "" : seat)} />
                            <span className={styles.checkboxText}>{seat}</span>
                          </label>
                        ))}
                    </div>
                  </div>
                </div>

                {/* Brand Tab */}
                 <div className={styles.tab}>
                   <div className={styles.tabHeader} onClick={() => setExpandedTabs(p => ({...p, brand: !p.brand}))}>
                    <span>Brand</span>
                    <FaChevronDown style={{ transform: expandedTabs.brand ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                  </div>
                  <div className={`${styles.tabContent} ${expandedTabs.brand ? styles.open : ''}`}>
                     <div className={styles.customSelect}>
                        <select value={uiFilters.brand || ""} onChange={(e) => updateFilter("brand", e.target.value)}>
                          <option value="">All Brands</option>
                          {brands.map((brand) => (
                            <option key={brand} value={brand}>{brand}</option>
                          ))}
                        </select>
                        <FaChevronDown className={styles.chev} />
                      </div>
                  </div>
                </div>
              </div>
              
               <button className={styles.applyBtn} onClick={applyMobileFilters}>Apply Filters</button>
            </div>
        </aside>

        <div className={styles.content}>
          <div className={styles.secondaryBar}>
            <div className={styles.resultCount}>
              {loading ? <Skeleton width="180px" height="18px" /> : `${visibleCars.length} vehicles in ${city || 'your area'}`}
            </div>
            <button className={styles.recommendedBtn}>Most Recommended</button>
          </div>

          <div className={styles.activeFilters}>
            {Object.entries(filters).map(([key, val]) => {
              if (!val || (key === 'price' && !priceIsFiltered) || (key==='gps' && !val) || (key==='ac' && !val)) return null;
              return (
                <div key={key} className={styles.filterChip}>
                  {key === 'price' ? `${formatINR(val.min)} - ${formatINR(val.max)}` : val}
                  <button onClick={() => {
                     if (key === 'price') {
                       priceTouched.current = false;
                       setFilters((prev) => ({ ...prev, price: priceRange }));
                     }
                     else updateFilter(key, "");
                  }}>✕</button>
                </div>
              );
            })}
          </div>

          <div className={styles.resultsScrollableCard}>
            {loading ? (
              <div className={styles.grid}>
                {[1, 2, 3, 4, 5, 6].map((s) => (
                  <div key={s} className={styles.card}>
                    <Skeleton width="100%" height="200px" borderRadius="8px" style={{ marginBottom: '12px' }} />
                    <Skeleton width="80%" height="18px" style={{ marginBottom: '8px' }} />
                    <Skeleton width="60%" height="14px" style={{ marginBottom: '8px' }} />
                    <Skeleton width="40%" height="24px" />
                  </div>
                ))}
              </div>
            ) : visibleCars.length === 0 ? (
              <EmptyState 
                icon="🚗"
                title="No cars available"
                message="No cars found matching your criteria. Try adjusting your filters or search location."
              />
            ) : (
                <div className={styles.grid}>
                {visibleCars.map((car) => (
                  <CarCard
                    key={car.id} 
                    car={car} 
                    pickup={pickup} 
                    returndate={returndate} 
                    router={router} 
                    city={city}
                  />
                ))}
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}