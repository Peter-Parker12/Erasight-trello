import { z } from "zod";

export const AddCardMember = z.object({
  cardId: z.string(),
  boardId: z.string(),
  userId: z.string(),
  userName: z.string(),
  userImage: z.string(),
});

export const RemoveCardMember = z.object({
  cardId: z.string(),
  boardId: z.string(),
  userId: z.string(),
});
