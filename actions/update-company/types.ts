import { z } from "zod";
import { Company } from "@prisma/client";

import { ActionState } from "@/lib/create-safe-action";
import { UpdateCompany } from "./schema";

export type InputType = z.infer<typeof UpdateCompany>;
export type ReturnType = ActionState<InputType, Company>;
