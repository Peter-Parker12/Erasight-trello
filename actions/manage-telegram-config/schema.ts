import { z } from "zod";

export const UpdateTelegramConfig = z.object({
  boardId: z.string(),
  botToken: z.string().min(1, "Bot token is required"),
  chatId: z.string().min(1, "Chat ID is required"),
  topicId: z.string().optional().nullable(),
  enabled: z.boolean(),
});

export const RemoveTelegramConfig = z.object({
  boardId: z.string(),
});
