import { z } from "zod";
import { Objective } from "@prisma/client";
import { ActionState } from "@/lib/create-safe-action";
import { UpdateObjective } from "./schema";

export type InputType = z.infer<typeof UpdateObjective>;
export type ReturnType = ActionState<InputType, Objective>;
