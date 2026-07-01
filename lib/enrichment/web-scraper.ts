import * as cheerio from "cheerio";

import type { EnrichmentProvider, EnrichmentPayload } from "./types";

const FETCH_TIMEOUT_MS = 10_000;

// Full browser-like header set — bypasses most basic User-Agent and header checks.
const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Upgrade-Insecure-Requests": "1",
};

// ─── fetch helpers ────────────────────────────────────────────────────────────

async function timedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch {
    return null;
  }
}

async function fetchHtmlDirect(url: string): Promise<string | null> {
  const res = await timedFetch(url, { headers: BROWSER_HEADERS });
  if (!res || !res.ok) return null;
  const html = await res.text().catch(() => null);
  return html && !isBlockPage(html) ? html : null;
}

// ─── block detection ──────────────────────────────────────────────────────────

// Patterns that indicate the response is a CAPTCHA / WAF challenge page,
// not the real content.
const BLOCK_PATTERNS = [
  /access denied/i,
  /checking if the site connection is secure/i,
  /verify you are (a )?human/i,
  /enable javascript and cookies/i,
  /cloudflare ray id/i,
  /<title[^>]*>\s*just a moment/i,
  /<title[^>]*>\s*403/i,
  /<title[^>]*>\s*attention required/i,
];

function isBlockPage(html: string): boolean {
  // Real pages are rarely under 500 chars
  if (html.trim().length < 500) return true;
  return BLOCK_PATTERNS.some((re) => re.test(html));
}

// ─── fallback strategies ──────────────────────────────────────────────────────

// Strategy 1: direct fetch with browser headers (covers most basic blocking)
async function strategyDirect(domain: string): Promise<string | null> {
  return (
    (await fetchHtmlDirect(`https://${domain}`)) ??
    (await fetchHtmlDirect(`https://www.${domain}`))
  );
}

// Strategy 2: Google AMP Cache — served from Google's CDN, bypasses origin WAF.
// Format: https://domain-com.cdn.ampproject.org/v/s/{domain}/
// Works for pages that have an AMP version; silently fails if not.
async function strategyGoogleCache(domain: string): Promise<string | null> {
  const slug = domain.replace(/\./g, "-");
  const url = `https://${slug}.cdn.ampproject.org/v/s/${domain}/`;
  const res = await timedFetch(url, { headers: BROWSER_HEADERS });
  if (!res || !res.ok) return null;
  const html = await res.text().catch(() => null);
  return html && !isBlockPage(html) ? html : null;
}

// Strategy 3: Wayback Machine — fetch the latest archived snapshot.
// No auth needed, respects robots.txt on the archived copy.
async function strategyWayback(domain: string): Promise<string | null> {
  try {
    const apiUrl = `https://archive.org/wayback/available?url=${domain}`;
    const meta = await timedFetch(apiUrl);
    if (!meta || !meta.ok) return null;
    const json = (await meta.json()) as {
      archived_snapshots?: { closest?: { url?: string; available?: boolean } };
    };
    const snapshotUrl = json.archived_snapshots?.closest?.url;
    if (!snapshotUrl || !json.archived_snapshots?.closest?.available) return null;

    const res = await timedFetch(snapshotUrl, { headers: BROWSER_HEADERS });
    if (!res || !res.ok) return null;
    const html = await res.text().catch(() => null);
    return html && !isBlockPage(html) ? html : null;
  } catch {
    return null;
  }
}

// Strategy 4: DuckDuckGo Instant Answer API — free, no key, returns structured
// company data for well-known companies (Wikipedia-backed).
// Returns a partial EnrichmentPayload directly (no HTML parsing needed).
async function strategyDuckDuckGo(
  domain: string
): Promise<EnrichmentPayload | null> {
  try {
    // Query by domain — DDG resolves it to the company entity when it exists.
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(domain)}&format=json&no_html=1&skip_disambig=1`;
    const res = await timedFetch(url);
    if (!res || !res.ok) return null;

    const data = (await res.json()) as {
      Heading?: string;
      Image?: string;
      Infobox?: {
        content?: Array<{ label: string; value: string }>;
      };
    };

    if (!data.Heading) return null; // DDG didn't resolve to a known entity

    const payload: EnrichmentPayload = {};
    if (data.Heading) payload.name = data.Heading;
    if (data.Image && data.Image.startsWith("//")) {
      payload.logoUrl = `https:${data.Image}`;
    }

    const infobox = data.Infobox?.content ?? [];
    for (const item of infobox) {
      const label = item.label.toLowerCase();
      if (label === "industry") payload.industry = item.value;
      if (label === "number of employees" || label === "employees")
        payload.companySize = item.value;
      if (label === "headquarters" || label === "location")
        payload.address = item.value;
      if (label === "telephone" || label === "phone")
        payload.phone = item.value;
      if (label === "email") payload.email = item.value;
    }

    return payload;
  } catch {
    return null;
  }
}

// ─── HTML parsing ─────────────────────────────────────────────────────────────

function extractJsonLd(html: string): Record<string, unknown> {
  const $ = cheerio.load(html);
  const scripts = $('script[type="application/ld+json"]');
  for (let i = 0; i < scripts.length; i++) {
    try {
      const raw = $(scripts[i]).html();
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      const items: unknown[] = Array.isArray(parsed) ? parsed : [parsed];
      const org = items.find(
        (d): d is Record<string, unknown> =>
          typeof d === "object" &&
          d !== null &&
          ((d as Record<string, unknown>)["@type"] === "Organization" ||
            (d as Record<string, unknown>)["@type"] === "Corporation")
      );
      if (org) return org;
    } catch {
      // malformed JSON-LD — skip
    }
  }
  return {};
}

function formatAddress(addr: unknown): string | undefined {
  if (typeof addr === "string" && addr.trim()) return addr.trim();
  if (typeof addr === "object" && addr !== null) {
    const a = addr as Record<string, unknown>;
    return (
      [a.streetAddress, a.addressLocality, a.addressRegion, a.addressCountry]
        .filter((v): v is string => typeof v === "string" && v.trim() !== "")
        .join(", ") || undefined
    );
  }
  return undefined;
}

function findLinkedIn(html: string): string | undefined {
  const $ = cheerio.load(html);
  let found: string | undefined;
  $("a[href*='linkedin.com/company']").each((_, el) => {
    const href = $(el).attr("href");
    if (href) {
      found = href;
      return false;
    }
  });
  return found;
}

function findPhone(html: string, jsonLd: Record<string, unknown>): string | undefined {
  // 1. JSON-LD telephone field
  if (typeof jsonLd["telephone"] === "string" && jsonLd["telephone"].trim()) {
    return jsonLd["telephone"].trim();
  }
  const $ = cheerio.load(html);
  // 2. tel: href links
  let phone: string | undefined;
  $("a[href^='tel:']").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    const num = href.replace(/^tel:/, "").trim();
    if (num.length >= 7) { phone = num; return false; }
  });
  if (phone) return phone;
  // 3. Regex scan on visible text (E.164 or common formats)
  const text = $.root().text();
  const match = text.match(/(\+?\d[\d\s\-().]{6,18}\d)/);
  return match?.[1]?.trim();
}

function findEmail(html: string, jsonLd: Record<string, unknown>): string | undefined {
  // 1. JSON-LD email field
  if (typeof jsonLd["email"] === "string" && jsonLd["email"].trim()) {
    return jsonLd["email"].trim();
  }
  const $ = cheerio.load(html);
  // 2. mailto: href links — prefer non-generic addresses
  const emails: string[] = [];
  $("a[href^='mailto:']").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    const addr = href.replace(/^mailto:/, "").split("?")[0].trim().toLowerCase();
    if (addr.includes("@") && !addr.startsWith("noreply") && !addr.startsWith("no-reply")) {
      emails.push(addr);
    }
  });
  if (emails.length > 0) return emails[0];
  // 3. Regex scan on page text
  const text = $.root().text();
  const match = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
  return match?.[0]?.toLowerCase();
}

function titleToName(title: string): string {
  return title.split(/[|\-–—]/)[0].replace(/\s+/g, " ").trim();
}

function parseHtml(html: string, domain: string): Partial<EnrichmentPayload> {
  const $ = cheerio.load(html);
  const jsonLd = extractJsonLd(html);

  const name: string | undefined =
    (jsonLd["name"] as string | undefined) ||
    $('meta[property="og:site_name"]').attr("content") ||
    ($("title").text() ? titleToName($("title").text()) : undefined);

  const industry = jsonLd["industry"] as string | undefined;

  const companySize =
    jsonLd["numberOfEmployees"] !== undefined
      ? String(jsonLd["numberOfEmployees"])
      : undefined;

  const address = formatAddress(jsonLd["address"]);
  const linkedinUrl = findLinkedIn(html);

  const phone = findPhone(html, jsonLd);
  const email = findEmail(html, jsonLd);

  return { name, industry, companySize, address, linkedinUrl, phone, email };
}

// ─── logo resolution ──────────────────────────────────────────────────────────

// Clearbit Logo API is free and requires no auth key.
async function resolveLogoUrl(
  domain: string,
  html: string | null
): Promise<string | undefined> {
  const clearbitUrl = `https://logo.clearbit.com/${domain}`;
  try {
    const res = await timedFetch(clearbitUrl, { method: "HEAD" });
    if (res?.ok) return clearbitUrl;
  } catch {
    // fall through
  }

  if (!html) return undefined;

  const $ = cheerio.load(html);
  for (const sel of [
    'link[rel="apple-touch-icon"]',
    'link[rel="shortcut icon"]',
    'link[rel="icon"]',
  ]) {
    const href = $(sel).attr("href");
    if (href) {
      return href.startsWith("http")
        ? href
        : `https://${domain}${href.startsWith("/") ? "" : "/"}${href}`;
    }
  }
  return undefined;
}

// ─── provider ─────────────────────────────────────────────────────────────────

export const webScraperProvider: EnrichmentProvider = {
  key: "web-scraper",
  label: "Web Scraper",

  async enrich({ domain }) {
    let html: string | null = null;
    let strategyUsed = "none";

    // Try strategies in order, stop at first success.
    html = await strategyDirect(domain);
    if (html) {
      strategyUsed = "direct";
    } else {
      html = await strategyGoogleCache(domain);
      if (html) strategyUsed = "google-amp-cache";
    }

    if (!html) {
      html = await strategyWayback(domain);
      if (html) strategyUsed = "wayback-machine";
    }

    // If all HTML strategies failed, try DuckDuckGo structured data.
    if (!html) {
      const ddgPayload = await strategyDuckDuckGo(domain);

      // Even without page HTML, Clearbit logo may still work.
      const logoUrl = await resolveLogoUrl(domain, null);
      if (logoUrl && ddgPayload) ddgPayload.logoUrl = logoUrl;

      if (ddgPayload && Object.keys(ddgPayload).length > 0) {
        return {
          success: true,
          source: "duckduckgo",
          data: ddgPayload,
          raw: { domain, strategy: "duckduckgo", scrapedAt: new Date().toISOString() },
        };
      }

      // Last resort: return partial result with just the logo if Clearbit has it.
      if (logoUrl) {
        return {
          success: true,
          source: "clearbit-logo-only",
          data: { logoUrl },
          raw: { domain, strategy: "clearbit-logo-only", scrapedAt: new Date().toISOString() },
        };
      }

      return {
        success: false,
        status: "NOT_FOUND",
        error: `All scrape strategies failed for ${domain} (direct, google-cache, wayback, duckduckgo)`,
      };
    }

    const parsed = parseHtml(html, domain);
    const logoUrl = await resolveLogoUrl(domain, html);

    const payload: EnrichmentPayload = {};
    if (parsed.name) payload.name = parsed.name;
    if (logoUrl) payload.logoUrl = logoUrl;
    if (parsed.industry) payload.industry = parsed.industry;
    if (parsed.companySize) payload.companySize = parsed.companySize;
    if (parsed.linkedinUrl) payload.linkedinUrl = parsed.linkedinUrl;
    if (parsed.address) payload.address = parsed.address;
    if (parsed.phone) payload.phone = parsed.phone;
    if (parsed.email) payload.email = parsed.email;

    return {
      success: true,
      source: "web-scraper",
      data: payload,
      raw: {
        domain,
        strategy: strategyUsed,
        scrapedAt: new Date().toISOString(),
        jsonLd: extractJsonLd(html),
        pageTitle: cheerio.load(html)("title").text(),
      },
    };
  },
};
