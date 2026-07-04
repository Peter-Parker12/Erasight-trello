import { z } from "zod";

export const UpdateRole = z.object({
  id: z.string(),
  name: z.string().trim().min(1, "Name is required").max(50).optional(),
  description: z.string().max(300).nullable().optional(),
  actions: z.array(z.string().min(1)).optional(),
});
