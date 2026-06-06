import { z } from "zod";

export const AddBoardMember = z.object({
  boardId: z.string(),
  userId: z.string(),
  userName: z.string(),
  userImage: z.string(),
});

export const RemoveBoardMember = z.object({
  boardId: z.string(),
  userId: z.string(),
});