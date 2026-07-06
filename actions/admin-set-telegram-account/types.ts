import { z } from "zod";
import { UserTelegramAccount } from "@prisma/client";

import { ActionState } from "@/lib/create-safe-action";
import { AdminSetTelegramAccount } from "./schema";

export type InputType = z.infer<typeof AdminSetTelegramAccount>;
export type ReturnType = ActionState<InputType, UserTelegramAccount>;
