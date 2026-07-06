"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { createAuditLog } from "@/lib/create-audit-log";
import { isOrgAdmin } from "@/lib/board-access";
import { SEED_DEPARTMENTS } from "@/constants/okr";
import { SeedOkrDefaults } from "./schema";
import { InputType, ReturnType } from "./types";

const handler = async (_data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return { error: "Unauthorized" };

  const admin = await isOrgAdmin(orgId);
  if (!admin) return { error: "Only admins can manage departments." };

  const existing = await db.department.findMany({
    where: { orgId },
    select: { name: true },
  });
  const existingNames = new Set(existing.map((d) => d.name));

  const created = [];
  let order = existing.length;

  for (const seed of SEED_DEPARTMENTS) {
    if (existingNames.has(seed.name)) continue;
    const department = await db.department.create({
      data: { orgId, name: seed.name, color: seed.color, order: order++ },
    });
    created.push(department);
    await createAuditLog({
      entityId: department.id,
      entityType: "DEPARTMENT",
      entityTitle: department.name,
      action: "CREATE",
    });
  }

  revalidatePath(`/organization/${orgId}/dashboard/okrs`, "layout");
  return { data: created };
};

export const seedOkrDefaults = createSafeAction(SeedOkrDefaults, handler);
