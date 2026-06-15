import { z } from "zod";

import { pipelineStageBaseFields } from "@/lib/crm-schemas";

export const UpdatePipelineStage = z.object({
  ...pipelineStageBaseFields,
  name: pipelineStageBaseFields.name.optional(),
  order: z.number().optional(),
  id: z.string(),
});
