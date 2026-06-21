import { getAuth, isOrgAdmin } from "@/lib/auth-cache";

export { isOrgAdmin };

export const canAccessBoard = async (boardId: string, orgId: string): Promise<boolean> => {
  const { userId } = await getAuth();
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
