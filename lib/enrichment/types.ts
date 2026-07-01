export type EnrichmentPayload = {
  name?: string;
  domain?: string;
  logoUrl?: string;
  industry?: string;
  companySize?: string;
  revenueRange?: string;
  linkedinUrl?: string;
  address?: string;
  phone?: string;
  email?: string;
};

export type EnrichmentProviderResult =
  | { success: true; source: string; data: EnrichmentPayload; raw: unknown }
  | { success: false; status: "FAILED" | "NOT_FOUND"; error: string };

export type EnrichmentProvider = {
  readonly key: string;
  readonly label: string;
  enrich(input: { domain: string; companyId: string }): Promise<EnrichmentProviderResult>;
};

export type EnrichmentOverrideMode = "EMPTY_ONLY" | "OVERWRITE_ALL";

export const ENRICHMENT_FIELD_MAPPING = {
  name: "name",
  domain: "domain",
  logo: "logoUrl",
  industry: "industry",
  employee_count: "companySize",
  annual_revenue: "revenueRange",
  linkedin: "linkedinUrl",
  location: "address",
} as const satisfies Record<string, string>;

export const mapProviderPayload = (
  raw: Record<string, unknown>
): EnrichmentPayload => {
  const out: EnrichmentPayload = {};
  for (const [payloadKey, fieldKey] of Object.entries(ENRICHMENT_FIELD_MAPPING)) {
    const value = raw[payloadKey];
    if (value === null || value === undefined) continue;
    if (typeof value === "string" && value.trim() === "") continue;
    (out as Record<string, unknown>)[fieldKey] = value;
  }
  return out;
};
