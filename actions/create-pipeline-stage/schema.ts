import { z } from "zod";

import { pipelineStageBaseFields } from "@/lib/crm-schemas";

export const CreatePipelineStage = z.object(pipelineStageBaseFields);
