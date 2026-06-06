import { z } from "zod";
import { Card } from "@prisma/client";
import { ActionState } from "@/lib/create-safe-action";
import { UpdateCardDates } from "./schema";

export type InputType = z.infer<typeof UpdateCardDates>;
export type ReturnType = ActionState<InputType, Card>;
