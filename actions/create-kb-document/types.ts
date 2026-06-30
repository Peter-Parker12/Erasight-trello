import { z } from "zod";
import { KbDocument } from "@prisma/client";

import { ActionState } from "@/lib/create-safe-action";
import { CreateKbDocument } from "./schema";

export type InputType = z.infer<typeof CreateKbDocument>;
export type ReturnType = ActionState<InputType, KbDocument>;
