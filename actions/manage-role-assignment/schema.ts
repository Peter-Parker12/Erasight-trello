import { z } from "zod";

export const AddRoleAssignment = z.object({
  roleId: z.string(),
  userId: z.string(),
});

export const RemoveRoleAssignment = z.object({
  roleId: z.string(),
  userId: z.string(),
});
