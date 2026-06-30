import { z } from "zod";

export const CreateKbIndustry = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
});
