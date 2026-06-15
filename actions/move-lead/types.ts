import { z } from "zod";
import { Lead } from "@prisma/client";

import { ActionState } from "@/lib/create-safe-action";
import { MoveLead } from "./schema";

export type InputType = z.infer<typeof MoveLead>;
export type ReturnType = ActionState<InputType, Lead[]>;
