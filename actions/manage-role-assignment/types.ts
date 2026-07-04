import { z } from "zod";
import { UserRoleAssignment } from "@prisma/client";

import { ActionState } from "@/lib/create-safe-action";
import { AddRoleAssignment, RemoveRoleAssignment } from "./schema";

export type AddInputType = z.infer<typeof AddRoleAssignment>;
export type RemoveInputType = z.infer<typeof RemoveRoleAssignment>;
export type AddReturnType = ActionState<AddInputType, UserRoleAssignment | null>;
export type RemoveReturnType = ActionState<RemoveInputType, UserRoleAssignment | null>;
