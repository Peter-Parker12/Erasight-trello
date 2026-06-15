import { z } from "zod";
import { PipelineStage } from "@prisma/client";

import { ActionState } from "@/lib/create-safe-action";
import { CreatePipelineStage } from "./schema";

export type InputType = z.infer<typeof CreatePipelineStage>;
export type ReturnType = ActionState<InputType, PipelineStage>;
