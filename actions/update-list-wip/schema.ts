import { z } from "zod";

export const UpdateListWip = z.object({
  id: z.string(),
  boardId: z.string(),
  wipLimit: z.number().int().min(0).nullable(),
});
