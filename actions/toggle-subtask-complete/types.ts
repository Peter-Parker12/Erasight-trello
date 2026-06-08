import { z } from "zod";
import { Card } from "@prisma/client";
import { ActionState } from "@/lib/create-safe-action";
import { ToggleSubtaskComplete } from "./schema";

export type InputType = z.infer<typeof ToggleSubtaskComplete>;
export type ReturnType = ActionState<InputType, Card>;
