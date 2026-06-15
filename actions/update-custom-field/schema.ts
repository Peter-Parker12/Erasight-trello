import { z } from "zod";

export const UpdateCustomField = z.object({
  id: z.string(),
  label: z.string().min(1, "Label is required.").optional(),
  options: z.array(z.string()).optional(),
  required: z.boolean().optional(),
  order: z.number().optional(),
});
