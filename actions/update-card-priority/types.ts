import { z } from "zod";
import { Card } from "@prisma/client";
import { ActionState } from "@/lib/create-safe-action";
import { UpdateCardPriority } from "./schema";

export type InputType = z.infer<typeof UpdateCardPriority>;
export type ReturnType = ActionState<InputType, Card>;
