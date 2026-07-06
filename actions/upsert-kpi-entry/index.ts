"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { canManageDepartmentData } from "@/lib/okr-access";
import { UpsertKpiEntry } from "./schema";
import { InputType, ReturnType } from "./types";

// Hot path of the KPI spreadsheet grid — called per-cell on blur.
const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return { error: "Unauthorized" };

  const { kpiId, year, month, target, actual } = data;

  const kpi = await db.kpi.findUnique({ where: { id: kpiId } });
  if (!kpi || kpi.orgId !== orgId) return { error: "KPI not found." };

  const allowed = await canManageDepartmentData(orgId, kpi.departmentId);
  if (!allowed) return { error: "You don't have permission for this department." };

  const entry = await db.kpiEntry.upsert({
    where: { kpiId_year_month: { kpiId, year, month } },
    create: {
      kpiId,
      year,
      month,
      target: target ?? 0,
      actual: actual ?? null,
      updatedById: userId,
    },
    update: {
      ...(target !== undefined ? { target } : {}),
      ...(actual !== undefined ? { actual } : {}),
      updatedById: userId,
    },
  });

  revalidatePath(`/organization/${orgId}/dashboard/okrs`, "layout");
  return { data: entry };
};

export const upsertKpiEntry = createSafeAction(UpsertKpiEntry, handler);
