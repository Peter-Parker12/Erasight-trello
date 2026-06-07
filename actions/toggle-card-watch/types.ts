import { z } from "zod";
import { ActionState } from "@/lib/create-safe-action";
import { ToggleCardWatch } from "./schema";

export type InputType = z.infer<typeof ToggleCardWatch>;
export type ReturnType = ActionState<InputType, { watching: boolean }>;
