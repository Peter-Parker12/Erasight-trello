import { z } from "zod";

export const UpdateChecklistItem = z.object({
  id: z.string(),
  boardId: z.string(),
  content: z.string().min(1).max(500).optional(),
  completed: z.boolean().optional(),
});
