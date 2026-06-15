import { z } from "zod";

export const AddModuleAccess = z.object({
  module: z.string(),
  userId: z.string(),
});

export const RemoveModuleAccess = z.object({
  module: z.string(),
  userId: z.string(),
});
