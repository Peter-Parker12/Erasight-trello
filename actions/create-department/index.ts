"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { createAuditLog } from "@/lib/create-audit-log";
import { isOrgAdmin } from "@/lib/board-access";
import { CreateDepartment } from "./schema";
import { InputType, ReturnType } from "./types";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return { error: "Unauthorized" };

  const admin = await isOrgAdmin(orgId);
  if (!admin) return { error: "Only admins can manage departments." };

  const { name, leaderId, color } = data;

  const existing = await db.department.findUnique({
    where: { orgId_name: { orgId, name } },
  });
  if (existing) return { error: "A department with this name already exists." };

  const count = await db.department.count({ where: { orgId } });

  const department = await db.department.create({
    data: {
      orgId,
      name,
      leaderId: leaderId || null,
      color: color || null,
      order: count,
    },
  });

  await createAuditLog({
    entityId: department.id,
    entityType: "DEPARTMENT",
    entityTitle: department.name,
    action: "CREATE",
  });

  revalidatePath(`/organization/${orgId}/okrs`, "layout");
  return { data: department };
};

export const createDepartment = createSafeAction(CreateDepartment, handler);
