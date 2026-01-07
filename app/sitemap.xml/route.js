export async function GET() {
  const baseUrl = "https://www.mmmiles.com";

  const pages = [
    "",
    "/about",
    "/contact",
    "/reviews",
    "/faq",
    "/login",
    "/cars",
  ];

  const urls = pages
    .map(
      (page) => `
  <url>
    <loc>${baseUrl}${page}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
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
