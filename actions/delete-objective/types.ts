import { z } from "zod";
import { Objective } from "@prisma/client";
import { ActionState } from "@/lib/create-safe-action";
import { DeleteObjective } from "./schema";

export type InputType = z.infer<typeof DeleteObjective>;
export type ReturnType = ActionState<InputType, Objective>;
