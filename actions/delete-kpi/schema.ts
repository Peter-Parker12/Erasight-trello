import { z } from "zod";

export const DeleteKpi = z.object({
  id: z.string(),
});
