import { z } from "zod";

export const DeleteCustomField = z.object({
  id: z.string(),
});
