"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { createAuditLog } from "@/lib/create-audit-log";
import { isOrgAdmin } from "@/lib/board-access";
import { DeleteDepartment } from "./schema";
import { InputType, ReturnType } from "./types";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return { error: "Unauthorized" };

  const admin = await isOrgAdmin(orgId);
  if (!admin) return { error: "Only admins can manage departments." };

  const { id } = data;

  const department = await db.department.findUnique({ where: { id } });
  if (!department || department.orgId !== orgId) return { error: "Department not found." };

  const childCount = await db.department.count({ where: { parentId: id } });
  if (childCount > 0) {
    return { error: "Delete or reassign its sub-departments first." };
  }

  // relationMode = "prisma": delete related rows explicitly in one transaction
  await db.$transaction([
    db.kpiEntry.deleteMany({ where: { kpi: { departmentId: id } } }),
    db.kpi.deleteMany({ where: { departmentId: id } }),
    db.okrCheckIn.deleteMany({ where: { objective: { departmentId: id } } }),
    db.keyResult.deleteMany({ where: { objective: { departmentId: id } } }),
    db.objective.deleteMany({ where: { departmentId: id } }),
    db.department.delete({ where: { id } }),
  ]);

  await createAuditLog({
    entityId: department.id,
    entityType: "DEPARTMENT",
    entityTitle: department.name,
    action: "DELETE",
  });

  revalidatePath(`/organization/${orgId}/dashboard/okrs`, "layout");
  return { data: department };
};

export const deleteDepartment = createSafeAction(DeleteDepartment, handler);
