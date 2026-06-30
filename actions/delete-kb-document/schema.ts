import { z } from "zod";

export const DeleteKbDocument = z.object({
  id: z.string(),
});
