import { z } from "zod";

export const DeleteObjective = z.object({
  id: z.string(),
});
