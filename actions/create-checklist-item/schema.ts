import { z } from "zod";

export const CreateChecklistItem = z.object({
  checklistId: z.string(),
  cardId: z.string(),
  boardId: z.string(),
  content: z.string().min(1, "Content required").max(500),
});
