import { db } from "@/lib/db";

// After a subtask moves to a new list, updates the parent card's listId to
// match the least-advanced (lowest list.order) list among all its subtasks.
// This keeps the parent's "status" in sync with its most-behind subtask.
export const syncParentList = async (parentCardId: string, orgId: string): Promise<void> => {
  const subtasks = await db.card.findMany({
    where: {
      parentCardId,
      list: { board: { orgId } },
    },
    select: {
      listId: true,
      list: { select: { order: true } },
    },
  });

  if (subtasks.length === 0) return;

  const minOrder = Math.min(...subtasks.map((s) => s.list.order));
  const targetListId = subtasks.find((s) => s.list.order === minOrder)!.listId;

  const parent = await db.card.findUnique({
    where: { id: parentCardId },
    select: { listId: true },
  });

  if (!parent || parent.listId === targetListId) return;

  await db.card.update({ where: { id: parentCardId }, data: { listId: targetListId } });
};
