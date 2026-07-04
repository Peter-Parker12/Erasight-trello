import { z } from "zod";

export const UpdateKpi = z.object({
  id: z.string(),
  name: z
    .string()
    .min(1, { message: "Name is required." })
    .max(500, { message: "Name is too long." })
    .optional(),
  unit: z.string().max(50).optional().nullable(),
  direction: z.enum(["INCREASE", "DECREASE"]).optional(),
  order: z.number().int().min(0).optional(),
});
