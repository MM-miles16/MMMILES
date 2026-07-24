// ─────────────────────────────────────────────────────────────────────────────
// lib/posts/index.js
//
// HOW TO ADD A NEW POST:
// 1. Copy _TEMPLATE.js → create new file in lib/posts/your-slug.js
// 2. Add one import line below
// 3. Add the imported variable to allPosts array
// Done — everything else updates automatically
// ─────────────────────────────────────────────────────────────────────────────

import { post as post1 } from "./chennai-to-pondicherry";
import { post as post2 } from "./car-rental-chennai-weekends";
import { post as post3 } from "./chennai-to-coimbatore-self-drive-guide";

import { post as post4 } from "./best-places-chennai-coimbatore-summer-monsoon";
import { post as post5 } from "./cheapest-self-drive-car-rental-chennai-bangalore-weekends";
import { post as post6 } from "./ooty-self-drive-guide-bangalore-chennai-2026";
import { post as post7 } from "./best-platform-host-car-earn-money-chennai-bangalore-mm-miles";
import { post as post8 } from "./monthly-car-rental-chennai-bangalore-self-drive-guide";
import { post as post9 } from "./bangalore-to-coorg-self-drive-guide-2026";
import { post as post10 } from "./self-drive-car-rental-scams-bad-condition-india-mm-miles";
import { post as post11 } from "./car-rental-booking-cancellation-india-mm-miles-98-percent-success";
import { post as post12 } from "./self-drive-car-rental-chennai-bangalore-coimbatore-mysore-guide-2026";
import { post as post13 } from "./best-self-drive-car-rental-bangalore-areas-streets-2026";
import { post as post14 } from "./india-self-drive-car-rental-revolution-vs-ownership-2026";
import { post as post15 } from "./ultimate-south-india-road-trip-bible-self-drive-guide";
import { post as post16 } from "./traffic-rules-car-rental-india-transport-department-guide-2026";
import { post as post17 } from "./car-rental-accident-charges-india-mm-miles-policy";
import { post as post18 } from "./cheapest-self-drive-car-rental-india-2026-new-models-best-support";
import { post as post19 } from "./host-car-earn-money-mm-miles-20-percent-commission-guide";
import { post as post20 } from "./south-india-road-trip-self-drive-complete-guide-2026";
import { post as post21 } from "./monsoon-couple-road-trips-low-budget-self-drive-chennai-bangalore";
import { post as post22 } from "./why-cab-prices-rising-self-drive-car-rental-cheaper-mm-miles";
import { post as post23 } from "./airport-self-drive-car-rental-chennai-bangalore-mm-miles";
import { post as post24 } from "./real-use-cases-self-drive-car-rental-mm-miles-chennai-bangalore";
import { post as post25 } from "./couple-car-rental-problems-solved-mm-miles-chennai-bangalore";
import { post as post26 } from "./car-rental-cleanliness-maintenance-problems-india-mm-miles";
import { post as post27 } from "./car-hosting-fleet-business-mm-miles-earn-more-chennai-bangalore";
import { post as post28 } from "./monsoon-friends-trip-low-rainfall-places-india-self-drive-2026";
import { post as post29 } from "./weekend-bus-prices-rising-self-drive-cheaper-mm-miles-chennai-bangalore";
import { post as post30 } from "./corporate-self-drive-car-rental-chennai-bangalore-mm-miles-low-price";
import { post as post31 } from "./long-weekend-car-rental-lowest-price-chennai-bangalore-mm-miles-2026";
import { post as post32 } from "./women-safety-self-drive-car-rental-chennai-bangalore-mm-miles-2026";
import { post as post33 } from "./advantages-self-drive-car-rental-vs-owning-new-car-india-mm-miles";
import { post as post34 } from "./petrol-price-hike-2026-self-drive-car-rental-cheaper-cabs-mm-miles";
import { post as post35 } from "./rental-car-accident-real-stories-mm-miles-full-coverage-protection";
import { post as post36 } from "./offbeat-road-trips-chennai-bangalore-self-drive-2026-hidden-gems";
import { post as post37 } from "./bangalore-traffic-worst-city-world-2026-self-drive-solution-mm-miles";
//import { post as post16 } from "./traffic-rules-car-rental-india-transport-department-guide-2026";
// ─────────────────────────────────────────────────────────────────────────────

export const allPosts = [
  post1,
  post2,
  post3,
  post4,
  post5,
  post6,
  post7,
  post8,
  post9,
  post10,
  post11,
  post12,
  post13,
  post14,
  post15,
  post16,
  post17,
  post18,
  post19,
  post20,
  post21,
  post22,
  post23,
  post24,
  post25,
  post26,
  post27,
  post28,
  post29,
  post30,
  post31,
  post32,
  post33,
  post34,
  post35,
  post36,
  post37,
];

export function getPostBySlug(slug) {
  return allPosts.find((p) => p.slug === slug) || null;
}

export function getAllSlugs() {
  return allPosts.map((p) => p.slug);
}

export function getRecentPosts(count = 3) {
  return [...allPosts]
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    .slice(0, count);
}
