import { z } from "zod";

export const CreateAttachment = z.object({
  cardId: z.string(),
  boardId: z.string(),
  name: z.string().min(1, "Name required").max(200),
  url: z.string().url("Must be a valid URL"),
});
