import { z } from "zod";
import { KbFolder } from "@prisma/client";

import { ActionState } from "@/lib/create-safe-action";
import { DeleteKbFolder } from "./schema";

export type InputType = z.infer<typeof DeleteKbFolder>;
export type ReturnType = ActionState<InputType, KbFolder>;
