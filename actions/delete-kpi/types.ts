import { z } from "zod";
import { Kpi } from "@prisma/client";
import { ActionState } from "@/lib/create-safe-action";
import { DeleteKpi } from "./schema";

export type InputType = z.infer<typeof DeleteKpi>;
export type ReturnType = ActionState<InputType, Kpi>;
