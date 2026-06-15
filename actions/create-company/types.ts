import { z } from "zod";
import { Company } from "@prisma/client";

import { ActionState } from "@/lib/create-safe-action";
import { CreateCompany } from "./schema";

export type InputType = z.infer<typeof CreateCompany>;
export type ReturnType = ActionState<InputType, Company>;
