export async function GET() {
  const baseUrl = "https://www.mmmiles.com";

  const pages = [
    { path: "", priority: "1.0" },
    { path: "/car", priority: "0.9" },
    { path: "/about", priority: "0.7" },
    { path: "/contact", priority: "0.7" },
    { path: "/reviews", priority: "0.6" },
    { path: "/faq", priority: "0.6" },
  ];

  const urls = pages
    .map(
      ({ path, priority }) => `
  <url>
    <loc>${baseUrl}${path}</loc>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`
    )
    .join("");

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
