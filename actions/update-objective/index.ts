"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { createAuditLog } from "@/lib/create-audit-log";
import { canManageDepartmentData } from "@/lib/okr-access";
import { UpdateObjective } from "./schema";
import { InputType, ReturnType } from "./types";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return { error: "Unauthorized" };

  const { id, ...updates } = data;

  const existing = await db.objective.findUnique({ where: { id } });
  if (!existing || existing.orgId !== orgId) return { error: "Objective not found." };

  const allowed = await canManageDepartmentData(orgId, existing.departmentId);
  if (!allowed) return { error: "You don't have permission for this department." };

  const objective = await db.objective.update({
    where: { id },
    data: updates,
  });

  await createAuditLog({
    entityId: objective.id,
    entityType: "OBJECTIVE",
    entityTitle: objective.title,
    action: "UPDATE",
  });

  revalidatePath(`/organization/${orgId}/okrs`, "layout");
  return { data: objective };
};

export const updateObjective = createSafeAction(UpdateObjective, handler);
