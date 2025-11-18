"use client";

import { CityProvider } from "../context/CityContext";
import SearchBar from "../components/SearchBar";
import TrendingSection from "../components/TrendingSection";

export default function HomeContent() {
  return (
    <CityProvider>
      <SearchBar />
      <TrendingSection />
    </CityProvider>
  );
}
