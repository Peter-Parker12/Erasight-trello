import { cache } from "react";

import { db } from "@/lib/db";
import { isOrgAdmin } from "@/lib/auth-cache";
import type { Role } from "@prisma/client";

// All roles assigned to (orgId, userId). Cached per-request like isOrgAdmin.
export const getUserRoles = cache(async (orgId: string, userId: string): Promise<Role[]> => {
  const assignments = await db.userRoleAssignment.findMany({
    where: { orgId, userId },
    include: { role: true },
  });
  return assignments.map((a) => a.role);
});

// Union of every action string granted to the user via any assigned role.
export const getUserPermissions = cache(
  async (orgId: string, userId: string): Promise<Set<string>> => {
    const roles = await getUserRoles(orgId, userId);
    return new Set(roles.flatMap((r) => r.actions));
  }
);

// Role-only check — does NOT bypass for org admins. Use when you need to know
// whether a permission came from an explicit role grant (e.g. UI badges), as
// opposed to admin superuser status.
export const hasPermission = async (
  orgId: string,
  userId: string,
  action: string
): Promise<boolean> => {
  const permissions = await getUserPermissions(orgId, userId);
  return permissions.has(action);
};

// The call-site helper: admin bypass OR explicit permission grant. This is
// what every enforcement site should call.
export const canPerform = async (
  orgId: string,
  userId: string,
  action: string
): Promise<boolean> => {
  if (await isOrgAdmin(orgId)) return true;
  return hasPermission(orgId, userId, action);
};

// --- Role management (admin-only call sites use these) ---

export const listOrgRoles = (orgId: string): Promise<Role[]> =>
  db.role.findMany({ where: { orgId }, orderBy: { name: "asc" } });

export const findRoleByNameCI = (orgId: string, name: string, excludeId?: string) =>
  db.role.findFirst({
    where: {
      orgId,
      name: { equals: name.trim(), mode: "insensitive" },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });

export const getRoleMemberIds = async (orgId: string, roleId: string): Promise<string[]> => {
  const rows = await db.userRoleAssignment.findMany({
    where: { orgId, roleId },
    select: { userId: true },
  });
  return rows.map((r) => r.userId);
};
