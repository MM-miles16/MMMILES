"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { FaFilter, FaSearch, FaMapMarkerAlt, FaClock, FaCar, FaGasPump, FaCog, FaUsers, FaCalendarAlt, FaChevronDown } from "react-icons/fa";
import styles from "./filters.module.css";

// debounce helper
function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}

// Helper function to calculate distance
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

  const city = searchParams.get("city");
  const pickup = searchParams.get("pickupTime");
  const returndate = searchParams.get("returnTime");
  
  // Extract coordinates from URL parameters (sent from SearchBar)
  const userLat = searchParams.get("lat");
  const userLon = searchParams.get("lon");
  
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [brands, setBrands] = useState([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 2000 });
  const [priceValues, setPriceValues] = useState({ min: 0, max: 2000 });
  const [showFilters, setShowFilters] = useState(true); // Default to show filters on desktop

  const [filters, setFilters] = useState({
    type: "",
    fuel: "",
    transmission: "",
    seats: "",
    year: "",
    brand: "",
    priceMin: "",
    priceMax: "",
    gps: false,
    ac: false,
  });

  // debounce filter values to reduce API spam
  const debouncedFilters = useDebounce(filters);

  // Prepare user coordinates from URL parameters
  const userLocation = userLat && userLon ? {
    lat: parseFloat(userLat),
    lon: parseFloat(userLon)
  } : null;

  // Verify coordinates are valid numbers
  const isValidLocation = userLocation && 
    !isNaN(userLocation.lat) && 
    !isNaN(userLocation.lon) && 
    userLocation.lat !== 0 && 
    userLocation.lon !== 0;

  // Get address for display (fallback to city if no address provided)
  const searchAddress = searchParams.get("address");
  const displayLocation = searchAddress || city;

  // ---- fetch cars from Supabase via API ----
  useEffect(() => {
    async function fetchCars() {
      if (!city) return;
      setLoading(true);
      
      try {
        const params = new URLSearchParams({ city });
        
        // Add pickup and return times for availability check
        if (pickup) params.append("pickupTime", pickup);
        if (returndate) params.append("returnTime", returndate);
        
        // Add filters (only non-empty values)
        Object.entries(debouncedFilters).forEach(([key, val]) => {
          if (val && val !== false) params.append(key, val.toString());
        });

        const res = await fetch(`/api/cars?${params.toString()}`, {
          cache: "no-store",
        });
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error("API Error:", errorText);
          throw new Error(`API returned ${res.status}: ${errorText}`);
        }
        
        const data = await res.json();
        
        if (!Array.isArray(data)) {
          console.warn("API returned non-array data:", data);
          throw new Error("Invalid API response format");
        }

        // Calculate distance for each car synchronously to avoid flash
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

        // Extract unique brands for filter dropdown
        const uniqueBrands = [...new Set(data.map(car => car.make))].sort();
        setBrands(uniqueBrands);

        // Calculate price range
        if (data.length > 0) {
          const prices = data.map(car => parseFloat(car.hourly_rate) || 0);
          const minPrice = Math.min(...prices);
          const maxPrice = Math.max(...prices);
          setPriceRange({ min: Math.floor(minPrice), max: Math.ceil(maxPrice) });
          setPriceValues({ min: Math.floor(minPrice), max: Math.ceil(maxPrice) });
        }
        
      } catch (e) {
        console.error("Error fetching cars:", e);
        setCars([]);
      } finally {
        setLoading(false);
      }
    }

    fetchCars();
  }, [city, userLat, userLon, debouncedFilters, pickup, returndate]);

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      type: "",
      fuel: "",
      transmission: "",
      seats: "",
      year: "",
      brand: "",
      priceMin: "",
      priceMax: "",
      gps: false,
      ac: false,
    });
    setPriceValues(priceRange);
  };

  // Handle price range change
  const handlePriceChange = (min, max) => {
    setPriceValues({ min, max });
    setFilters(prev => ({
      ...prev,
      priceMin: min.toString(),
      priceMax: max.toString(),
    }));
  };

  return (
    <div className={styles.container}>
      {/* Top Bar */}
      <div className={styles.topBar}>
        <div className={styles.tabs}>
          <button className={styles.activeTab}>All Vehicles</button>
          <button className={styles.inactiveTab}>Nearby</button>
          <button className={styles.inactiveTab}>Recommended</button>
        </div>

        <div className={styles.search}>
          <FaMapMarkerAlt className={styles.searchIcon} />
          <input
            type="text"
            placeholder={`Search in ${city || 'your area'}`}
            onChange={(e) => {
              // Implement search functionality if needed
              console.log("Search:", e.target.value);
            }}
          />
        </div>

        <div className={styles.filterSort}>
          <button 
            className={styles.filterBtn}
            onClick={() => setShowFilters(!showFilters)}
          >
            <FaFilter className={styles.filterIcon} />
            Filters
          </button>
          <button className={styles.sortBtn}>
            <FaSearch className={styles.sortIcon} />
            Sort
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className={styles.main}>
        {/* Sidebar Filters */}
        {showFilters && (
          <aside className={styles.sidebar}>
            <div className={styles.sidebarHeader}>
              <h3 className={styles.filterTitle}>Filters</h3>
              <button className={styles.reset} onClick={resetFilters}>
                Reset All
              </button>
            </div>

            {/* Vehicle Type */}
            <div className={styles.block}>
              <h4 className={styles.label}>Vehicle Type</h4>
              <div className={styles.cardsRow}>
                {["SUV", "Sedan", "Hatchback", "Luxury", "Van"].map((type) => (
                  <button
                    key={type}
                    className={`${styles.selectCard} ${
                      filters.type === type ? styles.selectCardActive : ""
                    }`}
                    onClick={() =>
                      setFilters(prev => ({
                        ...prev,
                        type: prev.type === type ? "" : type
                      }))
                    }
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Brand */}
            <div className={styles.block}>
              <h4 className={styles.label}>Brand</h4>
              <div className={styles.customSelect}>
                <select
                  value={filters.brand}
                  onChange={(e) =>
                    setFilters(prev => ({ ...prev, brand: e.target.value }))
                  }
                >
                  <option value="">All Brands</option>
                  {brands.map((brand) => (
                    <option key={brand} value={brand}>
                      {brand}
                    </option>
                  ))}
                </select>
                <FaChevronDown className={styles.chev} />
              </div>
            </div>

            {/* Fuel Type */}
            <div className={styles.block}>
              <h4 className={styles.label}>Fuel Type</h4>
              <div className={styles.cardsRow}>
                {["Petrol", "Diesel", "Electric", "Hybrid"].map((fuel) => (
                  <button
                    key={fuel}
                    className={`${styles.selectCard} ${
                      filters.fuel === fuel ? styles.selectCardActive : ""
                    }`}
                    onClick={() =>
                      setFilters(prev => ({
                        ...prev,
                        fuel: prev.fuel === fuel ? "" : fuel
                      }))
                    }
                  >
                    {fuel}
                  </button>
                ))}
              </div>
            </div>

            {/* Transmission */}
            <div className={styles.block}>
              <h4 className={styles.label}>Transmission</h4>
              <div className={styles.cardsRow}>
                {["Manual", "Automatic"].map((trans) => (
                  <button
                    key={trans}
                    className={`${styles.selectCard} ${
                      filters.transmission === trans ? styles.selectCardActive : ""
                    }`}
                    onClick={() =>
                      setFilters(prev => ({
                        ...prev,
                        transmission: prev.transmission === trans ? "" : trans
                      }))
                    }
                  >
                    {trans}
                  </button>
                ))}
              </div>
            </div>

            {/* Seating Capacity */}
            <div className={styles.block}>
              <h4 className={styles.label}>Seating Capacity</h4>
              <div className={styles.cardsRow}>
                {["2", "4", "5", "6", "7", "8+"].map((seats) => (
                  <button
                    key={seats}
                    className={`${styles.selectCard} ${
                      filters.seats === seats ? styles.selectCardActive : ""
                    }`}
                    onClick={() =>
                      setFilters(prev => ({
                        ...prev,
                        seats: prev.seats === seats ? "" : seats
                      }))
                    }
                  >
                    {seats}
                  </button>
                ))}
              </div>
            </div>

            {/* Model Year */}
            <div className={styles.block}>
              <h4 className={styles.label}>Model Year</h4>
              <div className={styles.yearRange}>
                <input
                  type="range"
                  min="2018"
                  max="2025"
                  value={filters.year || "2023"}
                  onChange={(e) =>
                    setFilters(prev => ({ ...prev, year: e.target.value }))
                  }
                />
                <div className={styles.priceValues}>
                  <span>2018</span>
                  <span style={{ fontWeight: 'bold', color: '#446dff' }}>
                    {filters.year || "2023"}
                  </span>
                  <span>2025</span>
                </div>
              </div>
            </div>

            {/* Price Range */}
            <div className={styles.block}>
              <h4 className={styles.label}>Price Range (per hour)</h4>
              <div className={styles.priceRange}>
                <div className={styles.rangeTrack}></div>
                <input
                  type="range"
                  min={priceRange.min}
                  max={priceRange.max}
                  value={priceValues.min}
                  className={styles.rangeInput}
                  onChange={(e) => 
                    handlePriceChange(parseInt(e.target.value), priceValues.max)
                  }
                />
                <input
                  type="range"
                  min={priceRange.min}
                  max={priceRange.max}
                  value={priceValues.max}
                  className={styles.rangeInput}
                  onChange={(e) => 
                    handlePriceChange(priceValues.min, parseInt(e.target.value))
                  }
                />
              </div>
              <div className={styles.priceValues}>
                <span>₹{priceValues.min}</span>
                <span>₹{priceValues.max}</span>
              </div>
            </div>

            {/* Additional Features */}
            <div className={styles.block}>
              <h4 className={styles.label}>Features</h4>
              <div className={styles.toggleRow}>
                <div>
                  <h5 className={styles.labelSmall}>GPS Navigation</h5>
                  <p className={styles.subSmall}>Built-in navigation system</p>
                </div>
                <label className={styles.switch}>
                  <input 
                    type="checkbox" 
                    checked={filters.gps}
                    onChange={(e) =>
                      setFilters(prev => ({ ...prev, gps: e.target.checked }))
                    }
                  />
                  <span className={styles.sliderRound}></span>
                </label>
              </div>
              <div className={styles.toggleRow}>
                <div>
                  <h5 className={styles.labelSmall}>Air Conditioning</h5>
                  <p className={styles.subSmall}>Climate control</p>
                </div>
                <label className={styles.switch}>
                  <input 
                    type="checkbox" 
                    checked={filters.ac}
                    onChange={(e) =>
                      setFilters(prev => ({ ...prev, ac: e.target.checked }))
                    }
                  />
                  <span className={styles.sliderRound}></span>
                </label>
              </div>
            </div>
          </aside>
        )}

        {/* Content Area */}
        <div className={styles.content}>
          <div className={styles.resultCount}>
            {loading ? 'Searching...' : `${cars.length} vehicles in ${city}`}
          </div>
          
          {pickup && returndate && (
            <div className={styles.tags}>
              <span className={styles.tag}>
                <FaClock /> {pickup} - {returndate}
              </span>
            </div>
          )}

          {loading ? (
            <div className={styles.grid}>
              {[1, 2, 3, 4, 5, 6].map((s) => (
                <div key={s} className={styles.card}>
                  <div style={{height: '200px', background: '#f0f0f0', borderRadius: '8px', marginBottom: '12px'}}></div>
                  <div style={{height: '16px', background: '#f0f0f0', marginBottom: '8px'}}></div>
                  <div style={{height: '14px', background: '#f0f0f0', width: '60%'}}></div>
                </div>
              ))}
            </div>
          ) : cars.length === 0 ? (
            <p>No cars found matching your criteria.</p>
          ) : (
            <div className={styles.grid}>
              {cars.map((car) => (
                <div
                  key={car.id}
                  className={styles.card}
                  onClick={() =>
                    router.push(
                      `/car/${car.id}?pickup=${pickup}&return=${returndate}`
                    )
                  }
                >
                  <div className={styles.cardHeader}>
                    <div>
                      <h3 className={styles.carTitle}>
                        {car.make} {car.model}
                      </h3>
                      <p className={styles.carType}>{car.vehicle_type}</p>
                    </div>
                    <FaCar className={styles.bookmark} />
                  </div>
                  
                  <Image
                    src={"/cars/default.jpg"}
                    alt={`${car.make} ${car.model}`}
                    width={300}
                    height={200}
                    className={styles.carImg}
                  />
                  
                  <div style={{display: 'flex', gap: '8px', margin: '8px 0', flexWrap: 'wrap'}}>
                    {car.fuel_type && (
                      <span className={styles.blueTag}>
                        <FaGasPump style={{marginRight: '4px'}} /> {car.fuel_type}
                      </span>
                    )}
                    {car.transmission_type && (
                      <span className={styles.greenTag}>
                        <FaCog style={{marginRight: '4px'}} /> {car.transmission_type}
                      </span>
                    )}
                    {car.seating_capacity && (
                      <span className={styles.redTag}>
                        <FaUsers style={{marginRight: '4px'}} /> {car.seating_capacity} seats
                      </span>
                    )}
                  </div>
                  
                  <div className={styles.price}>
                    ₹{car.hourly_rate}/hour
                    {car.distance_km && (
                      <span style={{fontSize: '12px', color: '#6b7280', marginLeft: '12px'}}>
                        📍 {car.distance_km} km away
                      </span>
                    )}
                    {!car.distance_km && city && (
                      <span style={{fontSize: '12px', color: '#6b7280', marginLeft: '12px'}}>
                        📍 in {city}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}