import { z } from "zod";
import { UserZaloAccount } from "@prisma/client";
import { ActionState } from "@/lib/create-safe-action";
import { UpdateZaloAccount, RemoveZaloAccount } from "./schema";

export type UpdateInputType = z.infer<typeof UpdateZaloAccount>;
export type RemoveInputType = z.infer<typeof RemoveZaloAccount>;
export type UpdateReturnType = ActionState<UpdateInputType, UserZaloAccount | null>;
export type RemoveReturnType = ActionState<RemoveInputType, UserZaloAccount | null>;
