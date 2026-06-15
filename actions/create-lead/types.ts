import { z } from "zod";
import { Lead } from "@prisma/client";

import { ActionState } from "@/lib/create-safe-action";
import { CreateLead } from "./schema";

export type InputType = z.infer<typeof CreateLead>;
export type ReturnType = ActionState<InputType, Lead>;
