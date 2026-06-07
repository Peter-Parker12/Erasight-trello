import { z } from "zod";

export const UpdateTelegramAccount = z.object({
  telegramUsername: z
    .string()
    .min(1, "Telegram username is required")
    .max(64)
    .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers and underscores"),
});

export const RemoveTelegramAccount = z.object({});
