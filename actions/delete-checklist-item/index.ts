"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { ACTION, ENTITY_TYPE } from "@prisma/client";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { createAuditLog } from "@/lib/create-audit-log";
import { DeleteChecklistItem } from "./schema";
import { InputType, ReturnType } from "./types";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return { error: "Unauthorized" };

  const { id, boardId } = data;

  const item = await db.checklistItem.findUnique({
    where: { id },
    include: { checklist: { include: { card: { include: { list: { include: { board: true } } } } } } },
  });
  if (!item || item.checklist.card.list.board.orgId !== orgId) return { error: "Not found" };

  const deleted = await db.checklistItem.delete({ where: { id } });
  await createAuditLog({ entityId: id, entityType: ENTITY_TYPE.CHECKLIST_ITEM, entityTitle: item.content, action: ACTION.DELETE });
  revalidatePath(`/board/${boardId}`);
  return { data: deleted };
};

export const deleteChecklistItem = createSafeAction(DeleteChecklistItem, handler);
