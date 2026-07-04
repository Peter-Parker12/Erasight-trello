import { z } from "zod";

export const UpdateKeyResult = z.object({
  id: z.string(),
  title: z
    .string()
    .min(1, { message: "Title is required." })
    .max(500, { message: "Title is too long." })
    .optional(),
  targetValue: z.number().optional(),
  actualValue: z.number().optional(),
  unit: z.string().max(50).optional().nullable(),
  direction: z.enum(["INCREASE", "DECREASE"]).optional(),
  order: z.number().int().min(0).optional(),
});
