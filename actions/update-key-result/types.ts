import { z } from "zod";
import { KeyResult } from "@prisma/client";
import { ActionState } from "@/lib/create-safe-action";
import { UpdateKeyResult } from "./schema";

export type InputType = z.infer<typeof UpdateKeyResult>;
export type ReturnType = ActionState<InputType, KeyResult>;
