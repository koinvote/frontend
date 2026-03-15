/**
 * generate-sitemap.mjs
 *
 * Fetches all public events from the API and generates public/sitemap.xml.
 * Run before build: node scripts/generate-sitemap.mjs
 *
 * Env vars:
 *   API_BASE_URL  - API server base (default: http://35.229.204.234:8080/api/v1)
 *   SITE_BASE_URL - Production site URL (default: https://koinvote.com)
 */

import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const API_BASE_URL =
  process.env.API_BASE_URL ?? "http://35.229.204.234:8080/api/v1";
const SITE_BASE_URL = process.env.SITE_BASE_URL ?? "https://koinvote.com";

// Static routes with their SEO settings
const STATIC_URLS = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/create-event", changefreq: "weekly", priority: "0.9" },
  { path: "/about", changefreq: "monthly", priority: "0.8" },
  { path: "/help-faq", changefreq: "monthly", priority: "0.7" },
  { path: "/charges-refunds", changefreq: "monthly", priority: "0.6" },
  { path: "/support", changefreq: "monthly", priority: "0.6" },
  { path: "/verification-tool", changefreq: "monthly", priority: "0.6" },
  { path: "/privacy", changefreq: "monthly", priority: "0.5" },
  { path: "/terms", changefreq: "monthly", priority: "0.5" },
  { path: "/terms-reward-distribution", changefreq: "monthly", priority: "0.5" },
  { path: "/subscribe", changefreq: "monthly", priority: "0.5" },
];

async function fetchAllEvents(tab) {
  const events = [];
  let page = 1;
  const limit = 100;

  while (true) {
    const params = new URLSearchParams({
      tab,
      q: "",
      page: String(page),
      limit: String(limit),
      sortBy: "time",
      order: "desc",
    });

    const res = await fetch(`${API_BASE_URL}/events?${params}`);
    if (!res.ok) {
      console.warn(`  [warn] GET /events?tab=${tab}&page=${page} → ${res.status}`);
      break;
    }

    const json = await res.json();
    const pageEvents = json?.data?.events ?? [];
    events.push(...pageEvents);

    if (pageEvents.length < limit) break;
    page++;
  }

  return events;
}

function toW3CDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toISOString().split("T")[0];
}

function escapeXml(str) {
  return str.replace(/&/g, "&amp;").replace(/'/g, "&apos;").replace(/"/g, "&quot;");
}

function buildUrl({ loc, lastmod, changefreq, priority }) {
  let xml = `  <url>\n    <loc>${escapeXml(loc)}</loc>\n`;
  if (lastmod) xml += `    <lastmod>${lastmod}</lastmod>\n`;
  if (changefreq) xml += `    <changefreq>${changefreq}</changefreq>\n`;
  if (priority) xml += `    <priority>${priority}</priority>\n`;
  xml += `  </url>`;
  return xml;
}

async function main() {
  console.log("Generating sitemap...");
  console.log(`  API: ${API_BASE_URL}`);
  console.log(`  Site: ${SITE_BASE_URL}`);

  const urlEntries = [];

  // Static URLs
  for (const { path, changefreq, priority } of STATIC_URLS) {
    urlEntries.push(
      buildUrl({ loc: `${SITE_BASE_URL}${path}`, changefreq, priority })
    );
  }

  // Dynamic event URLs - only preheat and ongoing events
  const tabs = [
    { tab: "preheat", changefreq: "hourly", priority: "0.9" },
    { tab: "ongoing", changefreq: "hourly", priority: "0.9" },
  ];

  for (const { tab, changefreq, priority } of tabs) {
    console.log(`  Fetching tab: ${tab}`);
    try {
      const events = await fetchAllEvents(tab);
      console.log(`    → ${events.length} events`);

      for (const event of events) {
        const lastmod = toW3CDate(event.updated_at ?? event.deadline_at);
        urlEntries.push(
          buildUrl({
            loc: `${SITE_BASE_URL}/event/${event.event_id}`,
            lastmod,
            changefreq,
            priority,
          })
        );
      }
    } catch (err) {
      console.warn(`  [warn] Failed to fetch tab "${tab}":`, err.message);
    }
  }

  const xml = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urlEntries,
    `</urlset>`,
  ].join("\n");

  const outPath = resolve(__dirname, "../public/sitemap.xml");
  writeFileSync(outPath, xml, "utf-8");
  console.log(`✓ Sitemap written to ${outPath} (${urlEntries.length} URLs)`);
}

main().catch((err) => {
  console.error("Failed to generate sitemap:", err);
  process.exit(1);
});
