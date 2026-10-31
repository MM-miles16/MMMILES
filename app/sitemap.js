import { cars, carTypes } from "@/lib/cars";
import { getIndexableCities } from "@/lib/cities";
import { allPosts } from "@/lib/posts/index";

const BASE = "https://www.mmmiles.com";

// lastModified is set only where the real date is known (blog posts).
// Stamping "now" on every URL teaches Google to ignore the field.
export default function sitemap() {
  // Only cities Google may index — noindex cities (currently Coimbatore) are left out
  const active = getIndexableCities();

  const staticPages = [
    { url: BASE, priority: 1.0, changeFrequency: "weekly" },
    { url: `${BASE}/car`, priority: 0.9, changeFrequency: "weekly" },
    { url: `${BASE}/top-cars`, priority: 0.7, changeFrequency: "weekly" },
    { url: `${BASE}/about`, priority: 0.6, changeFrequency: "monthly" },
    { url: `${BASE}/contact`, priority: 0.6, changeFrequency: "monthly" },
    { url: `${BASE}/faq`, priority: 0.7, changeFrequency: "monthly" },
    { url: `${BASE}/insurance`, priority: 0.6, changeFrequency: "monthly" },
    { url: `${BASE}/steps`, priority: 0.5, changeFrequency: "monthly" },
  ];

  // /cities/[city]
  const cityPages = active.map((city) => ({
    url: `${BASE}/cities/${city.slug}`,
    changeFrequency: "weekly", priority: 0.9,
  }));

  // /cities/[city]/[segment] — areas
  const areaPages = active.flatMap((city) =>
    city.areas.map((area) => ({
      url: `${BASE}/cities/${city.slug}/${area.slug}`,
      changeFrequency: "weekly", priority: 0.85,
    }))
  );

  // /cities/[city]/[segment] — types
  const typePages = active.flatMap((city) =>
    carTypes.map((type) => ({
      url: `${BASE}/cities/${city.slug}/${type.slug}`,
      changeFrequency: "weekly", priority: 0.8,
    }))
  );

  // /rent/[slug]
  const carPages = cars.map((car) => ({
    url: `${BASE}/rent/${car.slug}`,
    changeFrequency: "monthly", priority: 0.8,
  }));

  // /rent/[slug]/[city]
  const carCityPages = cars.flatMap((car) =>
    active.map((city) => ({
      url: `${BASE}/rent/${car.slug}/${city.slug}`,
      changeFrequency: "monthly", priority: 0.85,
    }))
  );

  // /blog/[slug] — real dates from each post
  const postDate = (post) => new Date(post.updatedAt || post.publishedAt);
  const blogPosts = allPosts.map((post) => ({
    url: `${BASE}/blog/${post.slug}`,
    lastModified: postDate(post), changeFrequency: "monthly", priority: 0.7,
  }));
  const blogIndex = {
    url: `${BASE}/blog`,
    lastModified: new Date(Math.max(...allPosts.map((post) => postDate(post).getTime()))),
    changeFrequency: "weekly", priority: 0.7,
  };

  return [...staticPages, ...cityPages, ...areaPages, ...typePages, ...carPages, ...carCityPages, blogIndex, ...blogPosts];
}
