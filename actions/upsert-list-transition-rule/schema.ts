import { z } from "zod";

export const UpsertListTransitionRule = z.object({
  boardId: z.string(),
  listId: z.string(),
  actions: z.array(z.enum(["ADD_ASSIGNEE", "ADD_DUE_DATE"])),
});
