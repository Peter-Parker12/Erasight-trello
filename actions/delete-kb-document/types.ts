import { z } from "zod";
import { KbDocument } from "@prisma/client";

import { ActionState } from "@/lib/create-safe-action";
import { DeleteKbDocument } from "./schema";

export type InputType = z.infer<typeof DeleteKbDocument>;
export type ReturnType = ActionState<InputType, KbDocument>;
