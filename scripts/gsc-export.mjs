// ─────────────────────────────────────────────────────────────────────────────
// scripts/gsc-export.mjs
//
// Pulls Google Search Console data for mmmiles.com into CSV files under
// gsc-data/<today>/ and prints a summary per page family (city, area, car...).
//
// RUN:
//   npm run gsc                     performance (last 90 days) + sitemaps
//   npm run gsc -- --days=28        change the performance window
//   npm run gsc -- --inspect        also check Google's index status of every URL
//
// ONE-TIME SETUP:
// 1. Google Cloud → project that owns the service account → enable
//    "Google Search Console API"
// 2. Search Console → Settings → Users and permissions → Add user →
//    service account email (GOOGLE_CLIENT_EMAIL) → permission "Restricted"
//
// Credentials come from .env.local — the same service account used for Sheets:
// GOOGLE_SERVICE_ACCOUNT_JSON, or GOOGLE_CLIENT_EMAIL + GOOGLE_PRIVATE_KEY
// ─────────────────────────────────────────────────────────────────────────────

import fs from "node:fs";
import path from "node:path";
import { google } from "googleapis";

const SITE = "https://www.mmmiles.com";
const ROW_LIMIT = 25000;         // Search Analytics API max rows per request
const INSPECT_CONCURRENCY = 5;   // URL Inspection quota: 600/min, 2,000/day
const CAR_TYPES = ["suv", "sedan", "hatchback", "luxury", "automatic", "cheap", "electric", "7-seater"];
const METRICS = ["clicks", "impressions", "ctr", "position"];

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);
const days = Number(args.days) || 90;

const isoDate = (d) => d.toISOString().slice(0, 10);
const daysAgo = (n) => isoDate(new Date(Date.now() - n * 86400000));
const outDir = path.join("gsc-data", isoDate(new Date()));

// ── Auth ─────────────────────────────────────────────────────────────────────
function getCredentials() {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    const json = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    return { email: json.client_email, key: json.private_key };
  }
  if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
    return {
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    };
  }
  throw new Error(
    "No service account found. Set GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_CLIENT_EMAIL + GOOGLE_PRIVATE_KEY in .env.local"
  );
}

const { email, key } = getCredentials();
const auth = new google.auth.JWT({
  email,
  key,
  scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
});
const sc = google.searchconsole({ version: "v1", auth });

// Turns Google's error into the setup step that fixes it
function explain(err) {
  const msg = err?.response?.data?.error?.message || err.message;
  if (/has not been used|is disabled|SERVICE_DISABLED/i.test(msg)) {
    const project = msg.match(/project (\d+)/)?.[1];
    return (
      "Search Console API is not enabled for this service account's Google Cloud project.\n" +
      `  Enable it: https://console.cloud.google.com/apis/library/searchconsole.googleapis.com${project ? `?project=${project}` : ""}`
    );
  }
  if (/sufficient permission|forbidden|User does not have/i.test(msg)) {
    return (
      `${email} has no access to this property.\n` +
      `  Search Console → Settings → Users and permissions → Add user → ${email} → Restricted`
    );
  }
  return msg;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
// Groups a URL into its pSEO page family so rankings can be compared per template
function family(url) {
  const u = new URL(url);
  // Google Business Profile traffic: the old http://mmmiles.com link and Maps/Search tracking tokens
  if (u.protocol === "http:" || u.searchParams.has("rwg_token")) return "maps-listing";
  const seg = u.pathname.split("/").filter(Boolean);
  if (seg.length === 0) return "home";
  if (seg[0] === "blog") return seg.length > 1 ? "blog-post" : "blog";
  if (seg[0] === "rent") return seg.length > 2 ? "car-city" : "car";
  if (seg[0] === "cities") {
    if (seg.length === 2) return "city";
    return CAR_TYPES.includes(seg[2]) ? "city-type" : "city-area";
  }
  return "other";
}

function save(name, rows, columns) {
  const cell = (v) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [columns.join(","), ...rows.map((r) => columns.map((c) => cell(r[c])).join(","))].join("\n");
  // BOM so Excel opens ₹ and Tamil queries correctly
  fs.writeFileSync(path.join(outDir, name), "﻿" + csv);
  console.log(`  ${name.padEnd(22)} ${rows.length} rows`);
}

async function resolveSiteUrl() {
  if (process.env.GSC_SITE_URL) return process.env.GSC_SITE_URL;
  const { data } = await sc.sites.list();
  const sites = (data.siteEntry || []).map((s) => s.siteUrl);
  const match = ["sc-domain:mmmiles.com", `${SITE}/`, "https://mmmiles.com/"].find((s) => sites.includes(s));
  if (!match) {
    console.error(`✖ No mmmiles.com property is shared with ${email}.`);
    console.error(sites.length ? `  It can see: ${sites.join(", ")}` : "  It can see no properties yet.");
    console.error(`  Fix: Search Console → Settings → Users and permissions → Add user → ${email} → Restricted`);
    process.exit(1);
  }
  return match;
}

// ── Performance (Search Analytics) ───────────────────────────────────────────
async function performance(siteUrl, dimensions, startDate, endDate) {
  const rows = [];
  for (let startRow = 0; ; startRow += ROW_LIMIT) {
    const { data } = await sc.searchanalytics.query({
      siteUrl,
      requestBody: { startDate, endDate, dimensions, type: "web", rowLimit: ROW_LIMIT, startRow },
    });
    const batch = data.rows || [];
    for (const r of batch) {
      const row = Object.fromEntries(dimensions.map((d, i) => [d, r.keys[i]]));
      row.clicks = r.clicks;
      row.impressions = r.impressions;
      row.ctr = +(r.ctr * 100).toFixed(2);
      row.position = +r.position.toFixed(1);
      if (row.page) row.family = family(row.page);
      rows.push(row);
    }
    if (batch.length < ROW_LIMIT) return rows;
  }
}

function familySummary(pageRows) {
  const byFamily = {};
  for (const r of pageRows) {
    const f = (byFamily[r.family] ??= { family: r.family, pages_with_impressions: 0, clicks: 0, impressions: 0, weighted: 0 });
    f.pages_with_impressions++;
    f.clicks += r.clicks;
    f.impressions += r.impressions;
    f.weighted += r.position * r.impressions;
  }
  return Object.values(byFamily)
    .map(({ weighted, ...f }) => ({ ...f, avg_position: f.impressions ? +(weighted / f.impressions).toFixed(1) : "" }))
    .sort((a, b) => b.impressions - a.impressions);
}

// ── URL Inspection ───────────────────────────────────────────────────────────
// Follows sitemap indexes too, so this keeps working once sitemaps are split
async function sitemapUrls(url, found = new Set()) {
  const xml = await (await fetch(url)).text();
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
  if (/<sitemapindex/.test(xml)) {
    for (const child of locs) await sitemapUrls(child, found);
  } else {
    locs.forEach((l) => found.add(l));
  }
  return found;
}

const sameUrl = (a, b) => a.replace(/\/$/, "") === b.replace(/\/$/, "");

async function inspect(siteUrl, url, inSitemap, retry = true) {
  const base = { url, family: family(url), inSitemap: inSitemap ? "yes" : "NO" };
  try {
    const { data } = await sc.urlInspection.index.inspect({
      requestBody: { inspectionUrl: url, siteUrl, languageCode: "en-IN" },
    });
    const r = data.inspectionResult?.indexStatusResult || {};
    return {
      ...base,
      verdict: r.verdict,
      coverageState: r.coverageState,
      indexingState: r.indexingState,
      pageFetchState: r.pageFetchState,
      robotsTxtState: r.robotsTxtState,
      lastCrawlTime: r.lastCrawlTime,
      crawledAs: r.crawledAs,
      userCanonical: r.userCanonical,
      googleCanonical: r.googleCanonical,
      canonicalMismatch: r.googleCanonical && r.userCanonical && !sameUrl(r.googleCanonical, r.userCanonical) ? "YES" : "",
    };
  } catch (err) {
    // Transient network drops (ECONNRESET etc.) — one retry
    if (retry && !err.response) return inspect(siteUrl, url, inSitemap, false);
    return { ...base, verdict: "ERROR", coverageState: err?.response?.data?.error?.message || err.message };
  }
}

async function inspectAll(siteUrl, pageRows) {
  const inSitemap = await sitemapUrls(`${SITE}/sitemap.xml`);
  const urls = new Set(inSitemap);
  // Blog posts are not in the sitemap yet — pick them up from the listing page
  const blogHtml = await (await fetch(`${SITE}/blog`)).text();
  for (const m of blogHtml.matchAll(/href="(\/blog\/[^"#?]+)"/g)) urls.add(SITE + m[1]);
  pageRows.forEach((r) => urls.add(r.page));

  const list = [...urls];
  console.log(`\nInspecting ${list.length} URLs (quota 2,000/day)...`);
  const results = new Array(list.length);
  let next = 0, done = 0;
  await Promise.all(
    Array.from({ length: INSPECT_CONCURRENCY }, async () => {
      while (next < list.length) {
        const i = next++;
        results[i] = await inspect(siteUrl, list[i], inSitemap.has(list[i]));
        if (++done % 25 === 0) process.stdout.write(`  ${done}/${list.length}\r`);
      }
    })
  );
  return results;
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const siteUrl = await resolveSiteUrl();
  fs.mkdirSync(outDir, { recursive: true });

  // Final GSC data lags ~2-3 days, so the window ends 3 days ago
  const endDate = daysAgo(3);
  const startDate = daysAgo(days + 3);
  console.log(`Property:    ${siteUrl}`);
  console.log(`Performance: ${startDate} → ${endDate} (${days} days)`);
  console.log(`Output:      ${outDir}/\n`);

  const queries = await performance(siteUrl, ["query"], startDate, endDate);
  const pages = await performance(siteUrl, ["page"], startDate, endDate);
  const queryPages = await performance(siteUrl, ["query", "page"], startDate, endDate);
  // Full 16-month daily trend — shows the effect of algorithm/spam updates
  const daily = await performance(siteUrl, ["date"], daysAgo(16 * 31), endDate);
  const summary = familySummary(pages);

  save("queries.csv", queries, ["query", ...METRICS]);
  save("pages.csv", pages, ["page", "family", ...METRICS]);
  save("query-page.csv", queryPages, ["query", "page", "family", ...METRICS]);
  save("daily-16-months.csv", daily, ["date", ...METRICS]);
  save("family-summary.csv", summary, ["family", "pages_with_impressions", "clicks", "impressions", "avg_position"]);

  const { data: sm } = await sc.sitemaps.list({ siteUrl });
  const sitemaps = (sm.sitemap || []).map((s) => ({
    path: s.path,
    lastSubmitted: s.lastSubmitted,
    lastDownloaded: s.lastDownloaded,
    isPending: s.isPending,
    errors: s.errors,
    warnings: s.warnings,
    submitted: (s.contents || []).reduce((n, c) => n + Number(c.submitted || 0), 0),
  }));
  save("sitemaps.csv", sitemaps, ["path", "lastSubmitted", "lastDownloaded", "isPending", "errors", "warnings", "submitted"]);

  if (args.inspect) {
    const results = await inspectAll(siteUrl, pages);
    save("index-status.csv", results, [
      "url", "family", "inSitemap", "verdict", "coverageState", "indexingState", "pageFetchState",
      "robotsTxtState", "lastCrawlTime", "crawledAs", "userCanonical", "googleCanonical", "canonicalMismatch",
    ]);
    const byState = {};
    for (const r of results) {
      const row = (byState[r.family] ??= {});
      const state = r.verdict === "ERROR" ? "ERROR" : r.coverageState || "unknown";
      row[state] = (row[state] || 0) + 1;
    }
    console.log("\nIndex status by page family:");
    console.table(byState);
  }

  // ── Console summary ──
  if (!pages.length) {
    console.log("\nNo performance data yet — a newly verified property can take a few days to fill.");
  } else {
    console.log("\nPerformance by page family:");
    console.table(summary);
    console.log("Top 20 queries by impressions:");
    console.table(
      [...queries]
        .sort((a, b) => b.impressions - a.impressions)
        .slice(0, 20)
        .map(({ query, clicks, impressions, position }) => ({ query, clicks, impressions, position }))
    );
  }
  if (!sitemaps.length) {
    console.log(`No sitemap submitted yet — Search Console → Sitemaps → submit ${SITE}/sitemap.xml`);
  }
}

main().catch((err) => {
  console.error("\n✖ " + explain(err));
  process.exit(1);
});
