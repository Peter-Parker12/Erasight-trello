import { z } from "zod";

export const DeleteContact = z.object({
  id: z.string(),
});
