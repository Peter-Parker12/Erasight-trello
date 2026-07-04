import { z } from "zod";

export const UpdateOrgTelegramConfig = z.object({
  botToken: z.string().min(1, { message: "Bot token is required." }),
  chatId: z.string().min(1, { message: "Chat ID is required." }),
  topicId: z.string().optional().nullable(),
  enabled: z.boolean(),
});

export const RemoveOrgTelegramConfig = z.object({});
