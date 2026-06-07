import { z } from "zod";
import { Card } from "@prisma/client";
import { ActionState } from "@/lib/create-safe-action";
import { CreateSubtask } from "./schema";

export type InputType = z.infer<typeof CreateSubtask>;
export type ReturnType = ActionState<InputType, Card>;
