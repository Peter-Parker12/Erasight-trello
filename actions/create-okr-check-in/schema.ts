import { z } from "zod";

export const CreateOkrCheckIn = z.object({
  objectiveId: z.string(),
  note: z.string().max(2000).optional().nullable(),
});
