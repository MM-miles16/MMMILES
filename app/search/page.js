import React, { Suspense } from "react";
import SearchClient from "./SearchClient";
import "./search.css";

// A loading skeleton for the search results page
function LoadingState() {
  return (
    <div className="search-results-page">
      <h1 className="results-title">Searching for available cars...</h1>
      <p className="results-subtitle">Please wait a moment.</p>
      {/* You can add shimmering placeholder cards here for a better UX */}
      <div className="cars-grid">
          {/* Example of a loading card skeleton */}
          <div className="car-card-skeleton"></div>
          <div className="car-card-skeleton"></div>
          <div className="car-card-skeleton"></div>
          <div className="car-card-skeleton"></div>
      </div>
    </div>
  );
}

// The main Server Component for the search page
export default function SearchPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <SearchClient />
    </Suspense>
  );
}
