import { z } from "zod";

export const MoveCardToList = z.object({
  id: z.string(),
  boardId: z.string(),
  listId: z.string(),
});
