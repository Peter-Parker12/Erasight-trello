import { z } from "zod";

export const CreateComment = z.object({
  cardId: z.string(),
  boardId: z.string(),
  content: z.string().max(2000).optional().default(""),
  imageUrl: z.string().optional(),
}).refine((d) => (d.content && d.content.trim().length > 0) || !!d.imageUrl, {
  message: "Comment cannot be empty",
});
