import type { EnrichmentOverrideMode, EnrichmentPayload } from "./types";
import { ENRICHMENT_FIELD_MAPPING } from "./types";

export type EnrichmentPatchKey =
  (typeof ENRICHMENT_FIELD_MAPPING)[keyof typeof ENRICHMENT_FIELD_MAPPING];

export type EnrichmentPatch = Partial<Record<EnrichmentPatchKey, string>>;

type CurrentCompanySnapshot = Partial<Record<EnrichmentPatchKey, string | null>> & {
  enrichmentStatus?: string | null;
};

const isEmptyValue = (value: unknown): boolean =>
  value === null || value === undefined || value === "";

export const computeEnrichmentPatch = (
  current: CurrentCompanySnapshot,
  payload: EnrichmentPayload,
  mode: EnrichmentOverrideMode
): EnrichmentPatch => {
  const patch: EnrichmentPatch = {};

  for (const fieldKey of Object.values(ENRICHMENT_FIELD_MAPPING)) {
    const value = (payload as Record<string, unknown>)[fieldKey];
    if (value === undefined) continue;

    const existing = current[fieldKey as EnrichmentPatchKey];
    if (mode === "EMPTY_ONLY" && !isEmptyValue(existing)) continue;

    (patch as Record<string, unknown>)[fieldKey] = value;
  }

  return patch;
};

export const resolveOverrideMode = (
  current: { enrichmentStatus?: string | null },
  requested: EnrichmentOverrideMode
): EnrichmentOverrideMode =>
  current.enrichmentStatus === null || current.enrichmentStatus === undefined
    ? "EMPTY_ONLY"
    : requested;
