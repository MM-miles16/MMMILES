"use client";

import { CityProvider } from "../context/CityContext";
import SearchBar from "../components/SearchBar";
import FleetSection from "../components/FleetSection";

// city: the page's city on city pages (e.g. "Chennai"), so the search starts there
export default function HomeContent({ city }) {
  return (
    <CityProvider initialCity={city}>
      <SearchBar />
      <FleetSection />
    </CityProvider>
  );
}
