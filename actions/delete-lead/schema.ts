import { z } from "zod";

export const DeleteLead = z.object({
  id: z.string(),
});
