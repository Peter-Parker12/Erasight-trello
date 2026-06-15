import { z } from "zod";
import { PipelineStage } from "@prisma/client";

import { ActionState } from "@/lib/create-safe-action";
import { DeletePipelineStage } from "./schema";

export type InputType = z.infer<typeof DeletePipelineStage>;
export type ReturnType = ActionState<InputType, PipelineStage>;
