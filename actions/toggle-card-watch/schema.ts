import { z } from "zod";

export const ToggleCardWatch = z.object({
  cardId: z.string(),
  boardId: z.string(),
});
