"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { createAuditLog } from "@/lib/create-audit-log";
import { canManageDepartmentData } from "@/lib/okr-access";
import { DeleteObjective } from "./schema";
import { InputType, ReturnType } from "./types";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return { error: "Unauthorized" };

  const { id } = data;

  const existing = await db.objective.findUnique({ where: { id } });
  if (!existing || existing.orgId !== orgId) return { error: "Objective not found." };

  const allowed = await canManageDepartmentData(orgId, existing.departmentId);
  if (!allowed) return { error: "You don't have permission for this department." };

  await db.$transaction([
    db.okrCheckIn.deleteMany({ where: { objectiveId: id } }),
    db.keyResult.deleteMany({ where: { objectiveId: id } }),
    db.objective.delete({ where: { id } }),
  ]);

  await createAuditLog({
    entityId: existing.id,
    entityType: "OBJECTIVE",
    entityTitle: existing.title,
    action: "DELETE",
  });

  revalidatePath(`/organization/${orgId}/okrs`, "layout");
  return { data: existing };
};

export const deleteObjective = createSafeAction(DeleteObjective, handler);
