import { z } from "zod";
import { KbIndustry } from "@prisma/client";

import { ActionState } from "@/lib/create-safe-action";
import { CreateKbIndustry } from "./schema";

export type InputType = z.infer<typeof CreateKbIndustry>;
export type ReturnType = ActionState<InputType, KbIndustry>;
