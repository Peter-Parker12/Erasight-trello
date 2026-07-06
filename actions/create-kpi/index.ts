"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { createAuditLog } from "@/lib/create-audit-log";
import { canManageDepartmentData } from "@/lib/okr-access";
import { CreateKpi } from "./schema";
import { InputType, ReturnType } from "./types";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return { error: "Unauthorized" };

  const { name, departmentId, unit, direction } = data;

  const allowed = await canManageDepartmentData(orgId, departmentId);
  if (!allowed) return { error: "You don't have permission for this department." };

  const count = await db.kpi.count({ where: { orgId, departmentId } });

  const kpi = await db.kpi.create({
    data: { orgId, departmentId, name, unit: unit || null, direction, order: count },
  });

  await createAuditLog({
    entityId: kpi.id,
    entityType: "KPI",
    entityTitle: kpi.name,
    action: "CREATE",
  });

  revalidatePath(`/organization/${orgId}/dashboard/okrs`, "layout");
  return { data: kpi };
};

export const createKpi = createSafeAction(CreateKpi, handler);
