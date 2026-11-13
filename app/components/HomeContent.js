"use client";

import { CityProvider } from "../context/CityContext";
import SearchBar from "../components/SearchBar";
import FleetSection from "../components/FleetSection";

export default function HomeContent() {
  return (
    <CityProvider>
      <SearchBar />
      <FleetSection />
    </CityProvider>
  );
}
