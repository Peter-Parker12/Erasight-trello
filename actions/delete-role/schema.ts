import { z } from "zod";

export const DeleteRole = z.object({
  id: z.string(),
});
