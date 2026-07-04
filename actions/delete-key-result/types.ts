import { z } from "zod";
import { KeyResult } from "@prisma/client";
import { ActionState } from "@/lib/create-safe-action";
import { DeleteKeyResult } from "./schema";

export type InputType = z.infer<typeof DeleteKeyResult>;
export type ReturnType = ActionState<InputType, KeyResult>;
