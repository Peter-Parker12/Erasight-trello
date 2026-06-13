import { z } from "zod";
import { Card } from "@prisma/client";
import { ActionState } from "@/lib/create-safe-action";
import { MoveCardToList } from "./schema";

export type InputType = z.infer<typeof MoveCardToList>;
export type ReturnType = ActionState<InputType, Card>;
