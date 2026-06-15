import { z } from "zod";
import { Contact } from "@prisma/client";

import { ActionState } from "@/lib/create-safe-action";
import { DeleteContact } from "./schema";

export type InputType = z.infer<typeof DeleteContact>;
export type ReturnType = ActionState<InputType, Contact>;
