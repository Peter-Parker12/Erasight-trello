import { z } from "zod";
import { KpiEntry } from "@prisma/client";
import { ActionState } from "@/lib/create-safe-action";
import { UpsertKpiEntry } from "./schema";

export type InputType = z.infer<typeof UpsertKpiEntry>;
export type ReturnType = ActionState<InputType, KpiEntry>;
