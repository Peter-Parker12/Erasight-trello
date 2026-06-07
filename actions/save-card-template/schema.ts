import { z } from "zod";

export const SaveCardTemplate = z.object({
  cardId: z.string(),
  boardId: z.string(),
});
