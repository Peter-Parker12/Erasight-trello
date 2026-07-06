import { db } from "@/lib/db";

// Guards against pathological data producing an infinite walk.
const MAX_DEPTH = 50;

// Walks up the parent chain starting at `candidateParentId`. Returns true if
// `departmentId` is found along that chain (i.e. `departmentId` is an ancestor
// of, or equal to, `candidateParentId`). Used to reject a parentId change that
// would create a cycle: assigning `candidateParentId` as the parent of
// `departmentId` is only safe if `departmentId` is NOT one of its own
// ancestors-to-be.
export const isAncestorOrSelf = async (
  orgId: string,
  candidateParentId: string,
  departmentId: string
): Promise<boolean> => {
  let currentId: string | null = candidateParentId;
  let depth = 0;

  while (currentId && depth < MAX_DEPTH) {
    if (currentId === departmentId) return true;
    const current: { parentId: string | null } | null = await db.department.findFirst({
      where: { id: currentId, orgId },
      select: { parentId: true },
    });
    currentId = current?.parentId ?? null;
    depth++;
  }

  return false;
};
