import { z } from "zod";

export const DeleteApiKey = z.object({
  id: z.string(),
});
