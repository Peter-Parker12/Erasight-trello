import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { ACTION, ENTITY_TYPE } from "@prisma/client";

import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { createAuditLog } from "@/lib/create-audit-log";
import { UpdateCardDates } from "@/actions/update-card-dates/schema";
import { InputType, ReturnType } from "@/actions/update-card-dates/types";
import { toApiRoute } from "@/lib/api-route";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return { error: "Unauthorized" };

  const { id, boardId, startDate, dueDate, reviewDeadline } = data;

  const card = await db.card.findUnique({
    where: { id },
    include: { list: { include: { board: true } } },
  });
  if (!card || card.list.board.orgId !== orgId) return { error: "Card not found" };

  const updated = await db.card.update({
    where: { id },
    data: {
      startDate: startDate ? new Date(startDate) : null,
      dueDate: reviewDeadline ? null : (dueDate ? new Date(dueDate) : null),
      reviewDeadline: reviewDeadline ? new Date(reviewDeadline) : null,
    },
  });

  await createAuditLog({ entityId: id, entityType: ENTITY_TYPE.CARD, entityTitle: card.title, action: ACTION.UPDATE });
  revalidatePath(`/board/${boardId}`);
  return { data: updated };
};

export const POST = toApiRoute(createSafeAction(UpdateCardDates, handler));
