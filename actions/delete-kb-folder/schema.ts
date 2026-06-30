import { z } from "zod";

export const DeleteKbFolder = z.object({
  id: z.string(),
});
