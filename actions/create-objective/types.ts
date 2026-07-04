import { z } from "zod";
import { Objective } from "@prisma/client";
import { ActionState } from "@/lib/create-safe-action";
import { CreateObjective } from "./schema";

export type InputType = z.infer<typeof CreateObjective>;
export type ReturnType = ActionState<InputType, Objective>;
