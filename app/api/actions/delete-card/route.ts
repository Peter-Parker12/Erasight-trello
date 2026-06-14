import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

import { DeleteCard } from "@/actions/delete-card/schema";
import { InputType, ReturnType } from "@/actions/delete-card/types";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { createAuditLog } from "@/lib/create-audit-log";
import { ACTION, ENTITY_TYPE } from "@prisma/client";
import { toApiRoute } from "@/lib/api-route";

const deleteCardWithSubtasks = async (cardId: string) => {
  const subtasks = await db.card.findMany({
    where: { parentCardId: cardId },
    select: { id: true },
  });

  for (const subtask of subtasks) {
    await deleteCardWithSubtasks(subtask.id);
  }

  await db.card.delete({ where: { id: cardId } });
};

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return {
      error: "Unauthorized",
    };
  }

  const { id, boardId } = data;

  let card;

  try {
    card = await db.card.findFirst({
      where: {
        id,
        list: {
          board: {
            orgId,
          },
        },
      },
    });

    if (!card) {
      return {
        error: "Not found.",
      };
    }

    await deleteCardWithSubtasks(id);

    // create new activity log
    await createAuditLog({
      entityId: card.id,
      entityTitle: card.title,
      entityType: ENTITY_TYPE.CARD,
      action: ACTION.DELETE,
    });
  } catch (error) {
    return {
      error: "Failed to delete.",
    };
  }

  revalidatePath(`/board/${boardId}`);

  return { data: card };
};

export const POST = toApiRoute(createSafeAction(DeleteCard, handler));
