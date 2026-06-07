import { z } from "zod";
import { List } from "@prisma/client";
import { ActionState } from "@/lib/create-safe-action";
import { UpdateListWip } from "./schema";

export type InputType = z.infer<typeof UpdateListWip>;
export type ReturnType = ActionState<InputType, List>;
