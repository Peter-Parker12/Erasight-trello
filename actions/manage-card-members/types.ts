import { z } from "zod";
import { CardMember } from "@prisma/client";
import { ActionState } from "@/lib/create-safe-action";
import { AddCardMember, RemoveCardMember } from "./schema";

export type AddInputType = z.infer<typeof AddCardMember>;
export type RemoveInputType = z.infer<typeof RemoveCardMember>;
export type ReturnType = ActionState<AddInputType, CardMember | null>;
