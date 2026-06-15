import { auth, clerkClient } from "@clerk/nextjs/server";

import { isAdminRole } from "@/lib/roles";

export const isOrgAdmin = async (orgId: string): Promise<boolean> => {
  const { userId } = await auth();
  if (!userId) return false;
  try {
    const client = await clerkClient();
    const result = await client.organizations.getOrganizationMembershipList({
      organizationId: orgId,
      userId: [userId],
      limit: 1,
    });
    return isAdminRole(result.data[0]?.role);
  } catch {
    return false;
  }
};

export const canAccessBoard = async (boardId: string, orgId: string): Promise<boolean> => {
  const { userId } = await auth();
  if (!userId) return false;

  const admin = await isOrgAdmin(orgId);
  if (admin) return true;

  // Dynamic import to avoid circular deps
  const { db } = await import("@/lib/db");
  const memberCount = await db.boardMember.count({ where: { boardId } });

  // Board with no members assigned is open to all org members
  if (memberCount === 0) return true;

  const isMember = await db.boardMember.findUnique({
    where: { boardId_userId: { boardId, userId } },
  });
  return !!isMember;
};