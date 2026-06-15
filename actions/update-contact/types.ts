import { z } from "zod";
import { Contact } from "@prisma/client";

import { ActionState } from "@/lib/create-safe-action";
import { UpdateContact } from "./schema";

export type InputType = z.infer<typeof UpdateContact>;
export type ReturnType = ActionState<InputType, Contact>;
