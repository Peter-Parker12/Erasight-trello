import type { EnrichmentPayload, EnrichmentProvider } from "./types";

// Pure builder for the Phase 1 mock payload. Shared between the mock provider
// and the UI preview so the dialog shows exactly what the provider will write.
export const buildMockPayload = (domain: string): EnrichmentPayload => ({
  domain,
  industry: "Technology",
  companySize: "50-200",
  revenueRange: "$10M-$50M",
  linkedinUrl: `https://linkedin.com/company/${domain.split(".")[0]}`,
  logoUrl: `https://logo.clearbit.com/${domain}`,
  address: "123 Mock Street, San Francisco, CA",
});

// Phase 1: mock implementation. Trả data giả lập dựa trên domain.
const mockProvider: EnrichmentProvider = {
  key: "mock",
  label: "Mock (Phase 1)",
  async enrich({ domain, companyId }) {
    return {
      success: true,
      source: "mock",
      data: buildMockPayload(domain),
      raw: { mockedAt: new Date().toISOString(), domain, companyId },
    };
  },
};

// Phase 2 stubs — uncomment + implement HTTP call khi có API key.
// const clearbitProvider: EnrichmentProvider = { key: "clearbit", ... };
// const hunterProvider:   EnrichmentProvider = { key: "hunter",   ... };

const REGISTRY: Record<string, EnrichmentProvider> = {
  mock: mockProvider,
  // clearbit: clearbitProvider,
  // hunter:   hunterProvider,
};

// Được dùng khi ENRICHMENT_PROVIDER trỏ tới provider chưa đăng ký trong REGISTRY
// (ví dụ typo config, hoặc production set `clearbit` trước khi Phase 2 ship).
// Trả FAILED rõ ràng thay vì fallback mock im lặng — bắt được lỗi config sớm.
const brokenProvider: EnrichmentProvider = {
  key: "broken",
  label: "Broken (unknown provider)",
  async enrich({ domain }) {
    const configured = process.env.ENRICHMENT_PROVIDER;
    return {
      success: false,
      status: "FAILED",
      error: `Unknown ENRICHMENT_PROVIDER: ${configured} (domain=${domain})`,
    };
  },
};

export const getEnrichmentProvider = (): EnrichmentProvider => {
  const key = process.env.ENRICHMENT_PROVIDER;
  if (!key) return mockProvider; // dev default
  const found = REGISTRY[key];
  if (found) return found;
  return brokenProvider;
};

export const isEnrichmentEnabled = (): boolean =>
  (process.env.ENRICHMENT_ENABLED ?? "true") !== "false";
