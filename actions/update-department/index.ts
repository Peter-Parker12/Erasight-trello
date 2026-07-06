"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { createAuditLog } from "@/lib/create-audit-log";
import { isOrgAdmin } from "@/lib/board-access";
import { isAncestorOrSelf } from "@/lib/department-hierarchy";
import { UpdateDepartment } from "./schema";
import { InputType, ReturnType } from "./types";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return { error: "Unauthorized" };

  const admin = await isOrgAdmin(orgId);
  if (!admin) return { error: "Only admins can manage departments." };

  const { id, name, leaderId, color, order, parentId } = data;

  const existing = await db.department.findUnique({ where: { id } });
  if (!existing || existing.orgId !== orgId) return { error: "Department not found." };

  if (name && name !== existing.name) {
    const duplicate = await db.department.findUnique({
      where: { orgId_name: { orgId, name } },
    });
    if (duplicate) return { error: "A department with this name already exists." };
  }

  if (parentId !== undefined && parentId !== existing.parentId) {
    if (parentId) {
      const parent = await db.department.findFirst({ where: { id: parentId, orgId } });
      if (!parent) return { error: "Parent department not found." };
      if (await isAncestorOrSelf(orgId, parentId, id)) {
        return { error: "Can't set a department's own descendant as its parent." };
      }
    }
  }

  const department = await db.department.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(leaderId !== undefined ? { leaderId: leaderId || null } : {}),
      ...(color !== undefined ? { color: color || null } : {}),
      ...(order !== undefined ? { order } : {}),
      ...(parentId !== undefined ? { parentId: parentId || null } : {}),
    },
  });

  await createAuditLog({
    entityId: department.id,
    entityType: "DEPARTMENT",
    entityTitle: department.name,
    action: "UPDATE",
  });

  revalidatePath(`/organization/${orgId}/dashboard/okrs`, "layout");
  return { data: department };
};

export const updateDepartment = createSafeAction(UpdateDepartment, handler);
