import { z } from "zod";

export const CreateKeyResult = z.object({
  objectiveId: z.string(),
  title: z
    .string()
    .min(1, { message: "Title is required." })
    .max(500, { message: "Title is too long." }),
  targetValue: z.number().optional().nullable(),
  unit: z.string().max(50).optional().nullable(),
  direction: z.enum(["INCREASE", "DECREASE"]).default("INCREASE"),
});
