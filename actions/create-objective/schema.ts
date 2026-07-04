import { z } from "zod";

export const CreateObjective = z.object({
  title: z
    .string()
    .min(1, { message: "Title is required." })
    .max(500, { message: "Title is too long." }),
  departmentId: z.string().nullable(),
  ownerId: z.string().min(1, { message: "Owner is required." }),
  quarter: z.number().int().min(1).max(4),
  year: z.number().int().min(2020).max(2100),
});
