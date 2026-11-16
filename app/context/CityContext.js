"use client";

import React, { createContext, useContext, useState } from "react";
import { canonicalCity } from "@/lib/cities";

// Create the City Context
const CityContext = createContext();

// Custom hook to use the City Context
export function useCity() {
  const context = useContext(CityContext);
  if (!context) {
    throw new Error("useCity must be used within a CityProvider");
  }
  return context;
}

// City Provider Component. City pages pass their city (initialCity) so the search bar and
// fleet start there; elsewhere the search bar fills in the saved or default city on mount.
export function CityProvider({ children, initialCity = null }) {
  const [selectedCity, setSelectedCity] = useState(initialCity ? canonicalCity(initialCity) : null);
  const [pickupDateTime, setPickupDateTime] = useState(null);
  const [returnDateTime, setReturnDateTime] = useState(null);
  const [searchPlace, setSearchPlace] = useState(null); // { address, lat, lon } from the search bar

  const value = {
    selectedCity,
    setSelectedCity,
    pickupDateTime,
    setPickupDateTime,
    returnDateTime,
    setReturnDateTime,
    searchPlace,
    setSearchPlace,
  };

  return <CityContext.Provider value={value}>{children}</CityContext.Provider>;
}
