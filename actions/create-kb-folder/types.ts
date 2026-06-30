import { z } from "zod";
import { KbFolder } from "@prisma/client";

import { ActionState } from "@/lib/create-safe-action";
import { CreateKbFolder } from "./schema";

export type InputType = z.infer<typeof CreateKbFolder>;
export type ReturnType = ActionState<InputType, KbFolder>;
