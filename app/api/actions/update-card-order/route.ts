import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

import { UpdateCardOrder } from "@/actions/update-card-order/schema";
import { InputType, ReturnType } from "@/actions/update-card-order/types";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { notifyCardInReview } from "@/lib/board-telegram";
import { toApiRoute } from "@/lib/api-route";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return {
      error: "Unauthorized",
    };
  }

  const { items, boardId } = data;

  let updatedCards;
  let movedToReview: { id: string; title: string }[] = [];

  try {
    const config = await db.boardTelegramConfig.findUnique({ where: { boardId } });

    if (config?.enabled && config.reviewListId) {
      const candidates = items.filter((i) => i.listId === config.reviewListId);
      if (candidates.length > 0) {
        const before = await db.card.findMany({
          where: { id: { in: candidates.map((c) => c.id) } },
          select: { id: true, listId: true, title: true },
        });
        movedToReview = before
          .filter((b) => b.listId !== config.reviewListId && candidates.some((c) => c.id === b.id))
          .map((b) => ({ id: b.id, title: b.title }));
      }
    }

    const transaction = items.map((card) =>
      db.card.update({
        where: {
          id: card.id,
          list: {
            board: {
              orgId,
            },
          },
        },
        data: {
          order: card.order,
          listId: card.listId,
        },
      })
    );

    updatedCards = await db.$transaction(transaction);
  } catch (error) {
    return {
      error: "Failed to update.",
    };
  }

  for (const card of movedToReview) {
    await notifyCardInReview({ boardId, cardId: card.id, cardTitle: card.title });
  }

  revalidatePath(`/board/${boardId}`);
  return {
    data: updatedCards,
  };
};

export const POST = toApiRoute(createSafeAction(UpdateCardOrder, handler));
