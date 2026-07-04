import { z } from "zod";

export const CreateKpi = z.object({
  name: z
    .string()
    .min(1, { message: "Name is required." })
    .max(500, { message: "Name is too long." }),
  departmentId: z.string().nullable(),
  unit: z.string().max(50).optional().nullable(),
  direction: z.enum(["INCREASE", "DECREASE"]).default("INCREASE"),
});
