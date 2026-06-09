import { z } from "zod";
import { UserDisplayName } from "@prisma/client";
import { ActionState } from "@/lib/create-safe-action";
import { UpdateDisplayName, RemoveDisplayName } from "./schema";

export type UpdateInputType = z.infer<typeof UpdateDisplayName>;
export type RemoveInputType = z.infer<typeof RemoveDisplayName>;
export type UpdateReturnType = ActionState<UpdateInputType, UserDisplayName | null>;
export type RemoveReturnType = ActionState<RemoveInputType, UserDisplayName | null>;
