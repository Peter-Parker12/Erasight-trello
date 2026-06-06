import { z } from "zod";
import { BoardMember } from "@prisma/client";
import { ActionState } from "@/lib/create-safe-action";
import { AddBoardMember, RemoveBoardMember } from "./schema";

export type AddInputType = z.infer<typeof AddBoardMember>;
export type RemoveInputType = z.infer<typeof RemoveBoardMember>;
export type AddReturnType = ActionState<AddInputType, BoardMember | null>;
export type RemoveReturnType = ActionState<RemoveInputType, BoardMember | null>;