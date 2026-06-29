import type { EnrichmentProvider, EnrichmentPayload } from "./types";
import { webScraperProvider } from "./web-scraper";

// Phase 1 mock — returns plausible-looking fake data from the domain name.
// Useful for local dev / testing without network calls.
export const buildMockPayload = (domain: string): EnrichmentPayload => ({
  domain,
  industry: "Technology",
  companySize: "50-200",
  revenueRange: "$10M-$50M",
  linkedinUrl: `https://linkedin.com/company/${domain.split(".")[0]}`,
  logoUrl: `https://logo.clearbit.com/${domain}`,
  address: "123 Mock Street, San Francisco, CA",
});

const mockProvider: EnrichmentProvider = {
  key: "mock",
  label: "Mock (dev only)",
  async enrich({ domain, companyId }) {
    return {
      success: true,
      source: "mock",
      data: buildMockPayload(domain),
      raw: { mockedAt: new Date().toISOString(), domain, companyId },
    };
  },
};

// Phase 3 stubs — uncomment + implement HTTP call when API key is available.
// const clearbitProvider: EnrichmentProvider = { key: "clearbit", ... };
// const hunterProvider:   EnrichmentProvider = { key: "hunter",   ... };

const REGISTRY: Record<string, EnrichmentProvider> = {
  mock: mockProvider,
  "web-scraper": webScraperProvider,
  // clearbit: clearbitProvider,
  // hunter:   hunterProvider,
};

const brokenProvider: EnrichmentProvider = {
  key: "broken",
  label: "Broken (unknown provider)",
  async enrich({ domain }) {
    const configured = process.env.ENRICHMENT_PROVIDER;
    return {
      success: false,
      status: "FAILED",
      error: `Unknown ENRICHMENT_PROVIDER: "${configured}" (domain=${domain})`,
    };
  },
};

export const getEnrichmentProvider = (): EnrichmentProvider => {
  const key = process.env.ENRICHMENT_PROVIDER;
  if (!key) return webScraperProvider; // default to real scraper
  const found = REGISTRY[key];
  if (found) return found;
  return brokenProvider;
};

export const isEnrichmentEnabled = (): boolean =>
  (process.env.ENRICHMENT_ENABLED ?? "true") !== "false";
