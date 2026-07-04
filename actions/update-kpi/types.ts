import { z } from "zod";
import { Kpi } from "@prisma/client";
import { ActionState } from "@/lib/create-safe-action";
import { UpdateKpi } from "./schema";

export type InputType = z.infer<typeof UpdateKpi>;
export type ReturnType = ActionState<InputType, Kpi>;
