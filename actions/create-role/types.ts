import { z } from "zod";
import { Role } from "@prisma/client";

import { ActionState } from "@/lib/create-safe-action";
import { CreateRole } from "./schema";

export type InputType = z.infer<typeof CreateRole>;
export type ReturnType = ActionState<InputType, Role>;
