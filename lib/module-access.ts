import { auth } from "@clerk/nextjs/server";

import { db } from "@/lib/db";
import { isOrgAdmin } from "@/lib/board-access";
import { MODULE_KEYS, MODULE_REGISTRY, type ModuleKey } from "@/lib/modules";

// A module is gated the same way boards are today: if no ModuleAccess rows
// exist for (orgId, module), it falls back to the module's `defaultAccess`.
// As soon as at least one row exists, it becomes an allow-list (plus admins).
export const canAccessModule = async (
  orgId: string,
  userId: string,
  module: ModuleKey
): Promise<boolean> => {
  if (await isOrgAdmin(orgId)) return true;

  const memberCount = await db.moduleAccess.count({ where: { orgId, module } });

  if (memberCount === 0) return MODULE_REGISTRY[module].defaultAccess === "open";

  const membership = await db.moduleAccess.findUnique({
    where: { orgId_userId_module: { orgId, userId, module } },
  });

  return !!membership;
};

export const getAccessibleModules = async (
  orgId: string
): Promise<Record<ModuleKey, boolean>> => {
  const { userId } = await auth();

  if (!userId) {
    return Object.fromEntries(MODULE_KEYS.map((key) => [key, false])) as Record<
      ModuleKey,
      boolean
    >;
  }

  const entries = await Promise.all(
    MODULE_KEYS.map(async (key) => [key, await canAccessModule(orgId, userId, key)] as const)
  );

  return Object.fromEntries(entries) as Record<ModuleKey, boolean>;
};

// Whether (orgId, module) currently has explicit access restrictions configured.
export const isModuleRestricted = async (orgId: string, module: ModuleKey): Promise<boolean> => {
  const memberCount = await db.moduleAccess.count({ where: { orgId, module } });
  return memberCount > 0;
};
