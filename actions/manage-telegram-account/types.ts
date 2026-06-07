import { z } from "zod";
import { UserTelegramAccount } from "@prisma/client";
import { ActionState } from "@/lib/create-safe-action";
import { UpdateTelegramAccount, RemoveTelegramAccount } from "./schema";

export type UpdateInputType = z.infer<typeof UpdateTelegramAccount>;
export type RemoveInputType = z.infer<typeof RemoveTelegramAccount>;
export type UpdateReturnType = ActionState<UpdateInputType, UserTelegramAccount | null>;
export type RemoveReturnType = ActionState<RemoveInputType, UserTelegramAccount | null>;
