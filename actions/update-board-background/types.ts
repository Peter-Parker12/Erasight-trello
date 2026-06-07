import { z } from "zod";
import { Board } from "@prisma/client";
import { ActionState } from "@/lib/create-safe-action";
import { UpdateBoardBackground } from "./schema";

export type InputType = z.infer<typeof UpdateBoardBackground>;
export type ReturnType = ActionState<InputType, Board>;
