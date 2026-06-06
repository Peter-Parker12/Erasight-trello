import { z } from "zod";
import { Priority } from "@prisma/client";

export const UpdateCardPriority = z.object({
  id: z.string(),
  boardId: z.string(),
  priority: z.nativeEnum(Priority),
});
