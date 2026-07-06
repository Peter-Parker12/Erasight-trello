import { z } from "zod";

export const UpdateDepartment = z.object({
  id: z.string(),
  name: z
    .string()
    .min(1, { message: "Name is required." })
    .max(100, { message: "Name is too long." })
    .optional(),
  leaderId: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  order: z.number().int().min(0).optional(),
  parentId: z.string().optional().nullable(),
});
