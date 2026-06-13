import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { ACTION, ENTITY_TYPE } from "@prisma/client";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { createAuditLog } from "@/lib/create-audit-log";
import { toApiRoute } from "@/lib/api-route";
import { UpdateChecklistItem } from "@/actions/update-checklist-item/schema";
import { InputType, ReturnType } from "@/actions/update-checklist-item/types";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return { error: "Unauthorized" };

  const { id, boardId, content, completed } = data;

  const item = await db.checklistItem.findUnique({
    where: { id },
    include: { checklist: { include: { card: { include: { list: { include: { board: true } } } } } } },
  });
  if (!item || item.checklist.card.list.board.orgId !== orgId) return { error: "Not found" };

  const updated = await db.checklistItem.update({
    where: { id },
    data: { ...(content !== undefined && { content }), ...(completed !== undefined && { completed }) },
  });

  await createAuditLog({ entityId: id, entityType: ENTITY_TYPE.CHECKLIST_ITEM, entityTitle: item.content, action: ACTION.UPDATE });
  revalidatePath(`/board/${boardId}`);
  return { data: updated };
};

export const POST = toApiRoute(createSafeAction(UpdateChecklistItem, handler));
