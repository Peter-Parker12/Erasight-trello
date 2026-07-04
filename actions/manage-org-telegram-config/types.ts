import { z } from "zod";
import { OrgTelegramConfig } from "@prisma/client";
import { ActionState } from "@/lib/create-safe-action";
import { UpdateOrgTelegramConfig, RemoveOrgTelegramConfig } from "./schema";

export type UpdateInputType = z.infer<typeof UpdateOrgTelegramConfig>;
export type RemoveInputType = z.infer<typeof RemoveOrgTelegramConfig>;
export type UpdateReturnType = ActionState<UpdateInputType, OrgTelegramConfig>;
export type RemoveReturnType = ActionState<RemoveInputType, OrgTelegramConfig | null>;
