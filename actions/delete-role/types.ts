import { z } from "zod";
import { Role } from "@prisma/client";

import { ActionState } from "@/lib/create-safe-action";
import { DeleteRole } from "./schema";

export type InputType = z.infer<typeof DeleteRole>;
export type ReturnType = ActionState<InputType, Role | null>;
