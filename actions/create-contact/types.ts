import { z } from "zod";
import { Contact } from "@prisma/client";

import { ActionState } from "@/lib/create-safe-action";
import { CreateContact } from "./schema";

export type InputType = z.infer<typeof CreateContact>;
export type ReturnType = ActionState<InputType, Contact>;
