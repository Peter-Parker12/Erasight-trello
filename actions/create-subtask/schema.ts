import { z } from "zod";

export const CreateSubtask = z.object({
  title: z.string().min(1),
  parentCardId: z.string(),
  listId: z.string(),
  boardId: z.string(),
});
