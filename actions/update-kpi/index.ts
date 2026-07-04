"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { createAuditLog } from "@/lib/create-audit-log";
import { canManageDepartmentData } from "@/lib/okr-access";
import { UpdateKpi } from "./schema";
import { InputType, ReturnType } from "./types";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return { error: "Unauthorized" };

  const { id, unit, ...updates } = data;

  const existing = await db.kpi.findUnique({ where: { id } });
  if (!existing || existing.orgId !== orgId) return { error: "KPI not found." };

  const allowed = await canManageDepartmentData(orgId, existing.departmentId);
  if (!allowed) return { error: "You don't have permission for this department." };

  const kpi = await db.kpi.update({
    where: { id },
    data: {
      ...updates,
      ...(unit !== undefined ? { unit: unit || null } : {}),
    },
  });

  await createAuditLog({
    entityId: kpi.id,
    entityType: "KPI",
    entityTitle: kpi.name,
    action: "UPDATE",
  });

  revalidatePath(`/organization/${orgId}/okrs`, "layout");
  return { data: kpi };
};

export const updateKpi = createSafeAction(UpdateKpi, handler);
