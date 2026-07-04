import { z } from "zod";
import { Role } from "@prisma/client";

import { ActionState } from "@/lib/create-safe-action";
import { UpdateRole } from "./schema";

export type InputType = z.infer<typeof UpdateRole>;
export type ReturnType = ActionState<InputType, Role>;
