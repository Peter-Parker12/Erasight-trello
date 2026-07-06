import { z } from "zod";

export const AdminSetTelegramAccount = z.object({
  userId: z.string().min(1),
  telegramUsername: z
    .string()
    .min(1, "Telegram username is required")
    .max(64)
    // Allow a leading @ in input; it's stripped before storage.
    .regex(/^@?[a-zA-Z0-9_]+$/, "Only letters, numbers and underscores"),
});
