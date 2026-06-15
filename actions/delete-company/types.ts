import { z } from "zod";
import { Company } from "@prisma/client";

import { ActionState } from "@/lib/create-safe-action";
import { DeleteCompany } from "./schema";

export type InputType = z.infer<typeof DeleteCompany>;
export type ReturnType = ActionState<InputType, Company>;
