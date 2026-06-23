import { z } from "zod";

export const EnrichCompany = z.object({
  id: z.string(),
  overrideMode: z.enum(["EMPTY_ONLY", "OVERWRITE_ALL"]),
});
