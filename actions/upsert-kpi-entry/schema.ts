import { z } from "zod";

export const UpsertKpiEntry = z.object({
  kpiId: z.string(),
  year: z.number().int().min(2020).max(2100),
  month: z.number().int().min(1).max(12),
  target: z.number().optional(),
  actual: z.number().optional().nullable(),
});
