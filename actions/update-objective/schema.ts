import { z } from "zod";

export const UpdateObjective = z.object({
  id: z.string(),
  title: z
    .string()
    .min(1, { message: "Title is required." })
    .max(500, { message: "Title is too long." })
    .optional(),
  ownerId: z.string().min(1).optional(),
  quarter: z.number().int().min(1).max(4).optional(),
  year: z.number().int().min(2020).max(2100).optional(),
  order: z.number().int().min(0).optional(),
});
