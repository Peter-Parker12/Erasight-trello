"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { createAuditLog } from "@/lib/create-audit-log";
import { canManageDepartmentData } from "@/lib/okr-access";
import { CreateKeyResult } from "./schema";
import { InputType, ReturnType } from "./types";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return { error: "Unauthorized" };

  const { objectiveId, title, targetValue, unit, direction } = data;

  const objective = await db.objective.findUnique({ where: { id: objectiveId } });
  if (!objective || objective.orgId !== orgId) return { error: "Objective not found." };

  const allowed = await canManageDepartmentData(orgId, objective.departmentId);
  if (!allowed) return { error: "You don't have permission for this department." };

  const count = await db.keyResult.count({ where: { objectiveId } });

  const keyResult = await db.keyResult.create({
    data: {
      objectiveId,
      title,
      targetValue: targetValue ?? null,
      unit: unit || null,
      direction,
      order: count,
    },
  });

  await createAuditLog({
    entityId: keyResult.id,
    entityType: "KEY_RESULT",
    entityTitle: keyResult.title,
    action: "CREATE",
  });

  revalidatePath(`/organization/${orgId}/dashboard/okrs`, "layout");
  return { data: keyResult };
};

export const createKeyResult = createSafeAction(CreateKeyResult, handler);
