import { z } from "zod";

export const CreateComment = z.object({
  cardId: z.string(),
  boardId: z.string(),
  content: z.string().min(1, "Comment cannot be empty").max(2000),
});
