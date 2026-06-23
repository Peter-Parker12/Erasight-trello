import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { ACTION, ENTITY_TYPE } from "@prisma/client";

import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { createAuditLog } from "@/lib/create-audit-log";
import { MoveCardToList } from "@/actions/move-card-to-list/schema";
import { InputType, ReturnType } from "@/actions/move-card-to-list/types";
import { toApiRoute } from "@/lib/api-route";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return { error: "Unauthorized" };

  const { id, boardId, listId } = data;

  let updated;

  try {
    const card = await db.card.findUnique({
      where: { id },
      include: { list: { include: { board: true } } },
    });

    if (!card || card.list.board.orgId !== orgId || card.list.boardId !== boardId) {
      return { error: "Card not found" };
    }

    const lastCard = await db.card.findFirst({
      where: { listId },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const newOrder = lastCard ? lastCard.order + 1 : 1;

    const destinationList = await db.list.findUnique({
      where: { id: listId },
      select: { type: true },
    });

    const isCompleted = destinationList?.type === "DONE";

    updated = await db.card.update({
      where: { id },
      data: { 
        listId, 
        order: newOrder,
        completed: isCompleted,
      },
    });

    await createAuditLog({
      entityId: id,
      entityType: ENTITY_TYPE.CARD,
      entityTitle: card.title,
      action: ACTION.UPDATE,
    });
  } catch (error) {
    return { error: "Failed to update status." };
  }

  revalidatePath(`/board/${boardId}`);
  revalidatePath(`/organization/${orgId}/tasks`);

  return { data: updated };
};

export const POST = toApiRoute(createSafeAction(MoveCardToList, handler));
