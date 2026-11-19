import { z } from "zod";

export const UpdateZaloAccount = z.object({
  zaloName: z.string().trim().min(1, "Zalo name is required").max(64),
});

export const RemoveZaloAccount = z.object({});
