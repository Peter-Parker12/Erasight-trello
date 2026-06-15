import { z } from "zod";
import { Lead } from "@prisma/client";

import { ActionState } from "@/lib/create-safe-action";
import { UpdateLead } from "./schema";

export type InputType = z.infer<typeof UpdateLead>;
export type ReturnType = ActionState<InputType, Lead>;
