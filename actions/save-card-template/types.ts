import { z } from "zod";
import { CardTemplate } from "@prisma/client";
import { ActionState } from "@/lib/create-safe-action";
import { SaveCardTemplate } from "./schema";

export type InputType = z.infer<typeof SaveCardTemplate>;
export type ReturnType = ActionState<InputType, CardTemplate>;
