import type { Company } from "@prisma/client";

import type {
  EnrichmentOverrideMode,
  EnrichmentPayload,
} from "./types";
import { ENRICHMENT_FIELD_MAPPING } from "./types";

// Subset của Company mà enrichment có thể chạm vào — chỉ các field string-based,
// không bao gồm customFields (JsonValue) để tránh xung đột type khi spread vào
// Prisma `data:`.
export type EnrichmentPatchKey =
  (typeof ENRICHMENT_FIELD_MAPPING)[keyof typeof ENRICHMENT_FIELD_MAPPING];

export type EnrichmentPatch = Partial<Pick<Company, EnrichmentPatchKey>>;

const isEmptyValue = (value: unknown): boolean =>
  value === null || value === undefined || value === "";

// Trả về patch object chỉ chứa các field thực sự cần thay đổi.
// EMPTY_ONLY: bỏ qua field đã có giá trị truthy trên Company hiện tại.
// OVERWRITE_ALL: ghi đè tất cả field có trong payload.
//
// Input `payload` ở dạng normalized (key = Company field name), đã đi qua
// `mapProviderPayload` từ raw provider payload.
export const computeEnrichmentPatch = (
  current: Pick<Company, EnrichmentPatchKey>,
  payload: EnrichmentPayload,
  mode: EnrichmentOverrideMode
): EnrichmentPatch => {
  const patch: EnrichmentPatch = {};

  for (const fieldKey of Object.values(ENRICHMENT_FIELD_MAPPING)) {
    const value = (payload as Record<string, unknown>)[fieldKey];
    if (value === undefined) continue;

    const existing = current[fieldKey];
    const isEmpty = isEmptyValue(existing);

    if (mode === "EMPTY_ONLY" && !isEmpty) continue;

    (patch as Record<string, unknown>)[fieldKey] = value;
  }

  return patch;
};

// Lần đầu (enrichmentStatus null) → ép EMPTY_ONLY, bất kể admin chọn gì.
export const resolveOverrideMode = (
  current: Pick<Company, "enrichmentStatus">,
  requested: EnrichmentOverrideMode
): EnrichmentOverrideMode =>
  current.enrichmentStatus === null || current.enrichmentStatus === undefined
    ? "EMPTY_ONLY"
    : requested;
