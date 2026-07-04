import { auth } from "@clerk/nextjs/server";

import { isOrgAdmin } from "@/lib/board-access";
import { db } from "@/lib/db";

export type OkrRole = {
  userId: string | null;
  isAdmin: boolean;
  ledDepartmentIds: string[];
};

export const getOkrRole = async (orgId: string): Promise<OkrRole> => {
  const { userId } = await auth();
  if (!userId) return { userId: null, isAdmin: false, ledDepartmentIds: [] };

  const admin = await isOrgAdmin(orgId);
  const ledDepartments = await db.department.findMany({
    where: { orgId, leaderId: userId },
    select: { id: true },
  });

  return {
    userId,
    isAdmin: admin,
    ledDepartmentIds: ledDepartments.map((d) => d.id),
  };
};

// Admin manages everything; a department leader manages their own department's
// OKRs/KPIs; company-level data (departmentId null) is admin-only.
export const canManageDepartmentData = async (
  orgId: string,
  departmentId: string | null
): Promise<boolean> => {
  const { userId } = await auth();
  if (!userId) return false;

  const admin = await isOrgAdmin(orgId);
  if (admin) return true;

  if (!departmentId) return false;

  const department = await db.department.findUnique({
    where: { id: departmentId },
    select: { orgId: true, leaderId: true },
  });
  return !!department && department.orgId === orgId && department.leaderId === userId;
};
