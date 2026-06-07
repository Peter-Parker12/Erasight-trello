import { z } from "zod";

export const ToggleSubtaskComplete = z.object({
  id: z.string(),
  boardId: z.string(),
  completed: z.boolean(),
});
