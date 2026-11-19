import { z } from "zod";
import { BoardZaloConfig } from "@prisma/client";
import { ActionState } from "@/lib/create-safe-action";
import { UpdateZaloConfig, RemoveZaloConfig } from "./schema";

export type UpdateInputType = z.infer<typeof UpdateZaloConfig>;
export type RemoveInputType = z.infer<typeof RemoveZaloConfig>;
export type UpdateReturnType = ActionState<UpdateInputType, BoardZaloConfig | null>;
export type RemoveReturnType = ActionState<RemoveInputType, BoardZaloConfig | null>;
