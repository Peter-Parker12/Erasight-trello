import { z } from "zod";
import { OkrCheckIn } from "@prisma/client";
import { ActionState } from "@/lib/create-safe-action";
import { CreateOkrCheckIn } from "./schema";

export type InputType = z.infer<typeof CreateOkrCheckIn>;
export type ReturnType = ActionState<InputType, OkrCheckIn>;
