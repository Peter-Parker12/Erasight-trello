import { z } from "zod";
import { BoardTelegramConfig } from "@prisma/client";
import { ActionState } from "@/lib/create-safe-action";
import { UpdateTelegramConfig, RemoveTelegramConfig } from "./schema";

export type UpdateInputType = z.infer<typeof UpdateTelegramConfig>;
export type RemoveInputType = z.infer<typeof RemoveTelegramConfig>;
export type UpdateReturnType = ActionState<UpdateInputType, BoardTelegramConfig | null>;
export type RemoveReturnType = ActionState<RemoveInputType, BoardTelegramConfig | null>;
