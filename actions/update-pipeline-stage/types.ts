import { z } from "zod";
import { PipelineStage } from "@prisma/client";

import { ActionState } from "@/lib/create-safe-action";
import { UpdatePipelineStage } from "./schema";

export type InputType = z.infer<typeof UpdatePipelineStage>;
export type ReturnType = ActionState<InputType, PipelineStage>;
