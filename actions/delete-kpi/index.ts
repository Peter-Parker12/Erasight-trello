"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { createAuditLog } from "@/lib/create-audit-log";
import { canManageDepartmentData } from "@/lib/okr-access";
import { DeleteKpi } from "./schema";
import { InputType, ReturnType } from "./types";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return { error: "Unauthorized" };

  const { id } = data;

  const existing = await db.kpi.findUnique({ where: { id } });
  if (!existing || existing.orgId !== orgId) return { error: "KPI not found." };

  const allowed = await canManageDepartmentData(orgId, existing.departmentId);
  if (!allowed) return { error: "You don't have permission for this department." };

  await db.$transaction([
    db.kpiEntry.deleteMany({ where: { kpiId: id } }),
    db.kpi.delete({ where: { id } }),
  ]);

  await createAuditLog({
    entityId: existing.id,
    entityType: "KPI",
    entityTitle: existing.name,
    action: "DELETE",
  });

  revalidatePath(`/organization/${orgId}/okrs`, "layout");
  return { data: existing };
};

export const deleteKpi = createSafeAction(DeleteKpi, handler);
