"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { ACTION, ENTITY_TYPE } from "@prisma/client";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { createAuditLog } from "@/lib/create-audit-log";
import { CreateChecklistItem } from "./schema";
import { InputType, ReturnType } from "./types";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return { error: "Unauthorized" };

  const { checklistId, boardId, content } = data;

  const checklist = await db.checklist.findUnique({
    where: { id: checklistId },
    include: { card: { include: { list: { include: { board: true } } } } },
  });
  if (!checklist || checklist.card.list.board.orgId !== orgId) return { error: "Not found" };

  const count = await db.checklistItem.count({ where: { checklistId } });
  const item = await db.checklistItem.create({ data: { checklistId, content, order: count } });

  await createAuditLog({ entityId: item.id, entityType: ENTITY_TYPE.CHECKLIST_ITEM, entityTitle: content, action: ACTION.CREATE });
  revalidatePath(`/board/${boardId}`);
  return { data: item };
};

export const createChecklistItem = createSafeAction(CreateChecklistItem, handler);
