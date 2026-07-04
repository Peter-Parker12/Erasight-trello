import { z } from "zod";

export const DeleteKeyResult = z.object({
  id: z.string(),
});
