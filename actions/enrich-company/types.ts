import { z } from "zod";
import { Company } from "@prisma/client";

import { ActionState } from "@/lib/create-safe-action";
import { EnrichCompany } from "./schema";

export type InputType = z.infer<typeof EnrichCompany>;
export type ReturnType = ActionState<InputType, Company>;
