import { z } from "zod";
import { KbIndustry } from "@prisma/client";

import { ActionState } from "@/lib/create-safe-action";
import { DeleteKbIndustry } from "./schema";

export type InputType = z.infer<typeof DeleteKbIndustry>;
export type ReturnType = ActionState<InputType, KbIndustry>;
