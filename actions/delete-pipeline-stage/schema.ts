import { z } from "zod";

export const DeletePipelineStage = z.object({
  id: z.string(),
});
