"use client";

import React, { createContext, useContext, useState } from "react";

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

// City Provider Component
export function CityProvider({ children }) {
  const [selectedCity, setSelectedCity] = useState(null);
  const [pickupDateTime, setPickupDateTime] = useState(null);
  const [returnDateTime, setReturnDateTime] = useState(null);

  const value = {
    selectedCity,
    setSelectedCity,
    pickupDateTime,
    setPickupDateTime,
    returnDateTime,
    setReturnDateTime,
  };

  return <CityContext.Provider value={value}>{children}</CityContext.Provider>;
}
