import { z } from "zod";

export const MoveLead = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      order: z.number(),
      stageId: z.string(),
    })
  ),
});
