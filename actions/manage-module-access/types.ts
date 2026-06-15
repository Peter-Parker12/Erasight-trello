import { z } from "zod";
import { ModuleAccess } from "@prisma/client";

import { ActionState } from "@/lib/create-safe-action";
import { AddModuleAccess, RemoveModuleAccess } from "./schema";

export type AddInputType = z.infer<typeof AddModuleAccess>;
export type RemoveInputType = z.infer<typeof RemoveModuleAccess>;
export type AddReturnType = ActionState<AddInputType, ModuleAccess | null>;
export type RemoveReturnType = ActionState<RemoveInputType, ModuleAccess | null>;
