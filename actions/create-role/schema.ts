import { z } from "zod";

export const CreateRole = z.object({
  name: z.string().trim().min(1, "Name is required").max(50),
  description: z.string().max(300).optional(),
  actions: z.array(z.string().min(1)).default([]),
});
