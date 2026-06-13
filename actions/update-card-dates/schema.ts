import { z } from "zod";

export const UpdateCardDates = z.object({
  id: z.string(),
  boardId: z.string(),
  startDate: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  reviewDeadline: z.string().nullable().optional(),
});
