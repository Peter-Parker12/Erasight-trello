import { z } from "zod";

export const UpdateZaloConfig = z.object({
  boardId: z.string(),
  botToken: z.string().min(1, "Bot token is required"),
  chatId: z.string().min(1, "Chat ID is required"),
  enabled: z.boolean(),
});

export const RemoveZaloConfig = z.object({
  boardId: z.string(),
});
