import { z } from "zod";
import { Kpi } from "@prisma/client";
import { ActionState } from "@/lib/create-safe-action";
import { CreateKpi } from "./schema";

export type InputType = z.infer<typeof CreateKpi>;
export type ReturnType = ActionState<InputType, Kpi>;
