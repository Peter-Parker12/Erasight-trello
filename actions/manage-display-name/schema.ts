import { z } from "zod";

export const UpdateDisplayName = z.object({
  displayName: z
    .string()
    .min(1, "Display name is required")
    .max(50, "Max 50 characters")
    .trim(),
});

export const RemoveDisplayName = z.object({});
