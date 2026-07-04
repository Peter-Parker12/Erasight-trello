import { z } from "zod";
import { KeyResult } from "@prisma/client";
import { ActionState } from "@/lib/create-safe-action";
import { CreateKeyResult } from "./schema";

export type InputType = z.infer<typeof CreateKeyResult>;
export type ReturnType = ActionState<InputType, KeyResult>;
