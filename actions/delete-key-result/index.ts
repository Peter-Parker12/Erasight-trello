"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { createAuditLog } from "@/lib/create-audit-log";
import { canManageDepartmentData } from "@/lib/okr-access";
import { DeleteKeyResult } from "./schema";
import { InputType, ReturnType } from "./types";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return { error: "Unauthorized" };

  const { id } = data;

  const existing = await db.keyResult.findUnique({
    where: { id },
    include: { objective: true },
  });
  if (!existing || existing.objective.orgId !== orgId) {
    return { error: "Key result not found." };
  }

  const allowed = await canManageDepartmentData(orgId, existing.objective.departmentId);
  if (!allowed) return { error: "You don't have permission for this department." };

  await db.keyResult.delete({ where: { id } });

  await createAuditLog({
    entityId: existing.id,
    entityType: "KEY_RESULT",
    entityTitle: existing.title,
    action: "DELETE",
  });

  revalidatePath(`/organization/${orgId}/okrs`, "layout");
  const { objective: _objective, ...keyResult } = existing;
  return { data: keyResult };
};

export const deleteKeyResult = createSafeAction(DeleteKeyResult, handler);
