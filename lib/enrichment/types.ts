// Enrichment types & contracts.
//
// Phase 1 uses a mock provider; Phase 2 will plug in real providers
// (Clearbit / Hunter) by adding entries to the registry in `providers.ts`.
// Consumers (apply logic, server action, UI) only depend on these types —
// not on concrete providers.

// Payload chuẩn mà mọi provider phải trả về — đã normalized theo schema Company.
// Field nào provider không có → omit (không phải null).
export type EnrichmentPayload = {
  name?: string;
  domain?: string;
  logoUrl?: string;
  industry?: string;
  companySize?: string;
  revenueRange?: string;
  linkedinUrl?: string;
  address?: string;
};

// Provider error → lưu vào enrichmentRaw + set status FAILED/NOT_FOUND.
export type EnrichmentProviderResult =
  | { success: true; source: string; data: EnrichmentPayload; raw: unknown }
  | { success: false; status: "FAILED" | "NOT_FOUND"; error: string };

// Abstract interface — Phase 1 mock, Phase 2 plug-in real.
// Convention: type alias (không `interface`) khớp codebase (lib/api-auth.ts, lib/custom-fields.ts).
export type EnrichmentProvider = {
  readonly key: string; // "mock" | "clearbit" | "hunter"
  readonly label: string;
  enrich(input: {
    domain: string;
    companyId: string;
  }): Promise<EnrichmentProviderResult>;
};

// Override modes (chọn bởi admin trong dialog).
export type EnrichmentOverrideMode = "EMPTY_ONLY" | "OVERWRITE_ALL";

// Bảng mapping tĩnh — provider payload key → Company field key.
// Provider raw payload (Clearbit/Hunter style) → normalized Company schema.
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

// Normalize raw provider payload → EnrichmentPayload theo mapping trên.
// Field không có trong raw → omitted; field có giá trị null/undefined/empty → omitted.
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
