"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { createAuditLog } from "@/lib/create-audit-log";
import { canManageDepartmentData } from "@/lib/okr-access";
import { CreateObjective } from "./schema";
import { InputType, ReturnType } from "./types";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return { error: "Unauthorized" };

  const { title, departmentId, ownerId, quarter, year } = data;

  const allowed = await canManageDepartmentData(orgId, departmentId);
  if (!allowed) return { error: "You don't have permission for this department." };

  const count = await db.objective.count({
    where: { orgId, departmentId, year, quarter },
  });

  const objective = await db.objective.create({
    data: { orgId, departmentId, title, ownerId, quarter, year, order: count },
  });

  await createAuditLog({
    entityId: objective.id,
    entityType: "OBJECTIVE",
    entityTitle: objective.title,
    action: "CREATE",
  });

  revalidatePath(`/organization/${orgId}/dashboard/okrs`, "layout");
  return { data: objective };
};

export const createObjective = createSafeAction(CreateObjective, handler);
