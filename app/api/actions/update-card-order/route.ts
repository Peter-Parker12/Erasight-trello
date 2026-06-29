import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

import { UpdateCardOrder } from "@/actions/update-card-order/schema";
import { InputType, ReturnType } from "@/actions/update-card-order/types";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { notifyCardInReview, notifyReviewReady } from "@/lib/board-telegram";
import { toApiRoute } from "@/lib/api-route";
import { syncParentList } from "@/lib/sync-parent-list";
import { extractFileContent } from "@/lib/extract-file-content";
import { runClaudeReview } from "@/lib/claude-cli-review";

async function triggerAiReviewsForCards(cardIds: string[], boardId: string) {
  try {
    const cards = await db.card.findMany({
      where: { id: { in: cardIds } },
      select: {
        id: true,
        title: true,
        description: true,
        dueDate: true,
        priority: true,
        attachments: {
          where: { review: null }, // only attachments not yet reviewed
          select: { id: true, url: true, name: true },
        },
      },
    });

    for (const card of cards) {
      if (card.attachments.length === 0) continue;

      const cardContext = [
        `Title: ${card.title}`,
        card.description ? `Description: ${card.description}` : null,
        card.dueDate ? `Due date: ${card.dueDate.toISOString().split("T")[0]}` : null,
        card.priority !== "NONE" ? `Priority: ${card.priority}` : null,
      ]
        .filter(Boolean)
        .join("\n");

      for (const attachment of card.attachments) {
        try {
          const content = await extractFileContent(attachment.url);
          if (!content.trim()) continue;

          const review = await runClaudeReview(content, cardContext);

          await db.attachment.update({
            where: { id: attachment.id },
            data: { review, reviewedAt: new Date() },
          });

          await notifyReviewReady({
            boardId,
            cardId: card.id,
            cardTitle: card.title,
            attachmentName: attachment.name,
            reviewText: review,
          });
        } catch (err) {
          console.error(`[AI_REVIEW] Failed for attachment ${attachment.id}:`, err);
        }
      }
    }
  } catch (err) {
    console.error("[AI_REVIEW] triggerAiReviewsForCards failed:", err);
  }
}

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
  let telegramReviewListId: string | null = null;
  let aiReviewListId: string | null = null;

  try {
    const [telegramConfig, aiConfig] = await Promise.all([
      db.boardTelegramConfig.findUnique({ where: { boardId } }),
      db.boardAiConfig.findUnique({ where: { boardId } }),
    ]);

    telegramReviewListId = telegramConfig?.enabled && telegramConfig.reviewListId
      ? telegramConfig.reviewListId
      : null;

    aiReviewListId = aiConfig?.enabled && aiConfig.reviewListId
      ? aiConfig.reviewListId
      : null;

    // Detect cards moved into either the AI review list or the Telegram review list
    const triggerListIds = [...new Set([aiReviewListId, telegramReviewListId].filter(Boolean))] as string[];

    if (triggerListIds.length > 0) {
      const candidates = items.filter((i) => triggerListIds.includes(i.listId));
      if (candidates.length > 0) {
        const before = await db.card.findMany({
          where: { id: { in: candidates.map((c) => c.id) } },
          select: { id: true, listId: true, title: true },
        });
        movedToReview = before
          .filter((b) => !triggerListIds.includes(b.listId) && candidates.some((c) => c.id === b.id))
          .map((b) => ({ id: b.id, title: b.title }));
      }
    }

    const boardLists = await db.list.findMany({
      where: { boardId },
      select: { id: true, type: true },
    });

    const listTypeMap = new Map(boardLists.map((l) => [l.id, l.type]));

    const transaction = items.map((card) => {
      const listType = listTypeMap.get(card.listId);
      const completed = listType === "DONE";
      return db.card.update({
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
          completed,
        },
      });
    });

    updatedCards = await db.$transaction(transaction);
  } catch (error) {
    return {
      error: "Failed to update.",
    };
  }

  if (telegramReviewListId) {
    for (const card of movedToReview.filter((c) =>
      items.some((i) => i.id === c.id && i.listId === telegramReviewListId)
    )) {
      await notifyCardInReview({ boardId, cardId: card.id, cardTitle: card.title });
    }
  }

  // Fire AI review for cards that moved into the AI review list (async, non-blocking)
  if (aiReviewListId && movedToReview.length > 0) {
    const aiCandidates = movedToReview.filter((c) =>
      items.some((i) => i.id === c.id && i.listId === aiReviewListId)
    );
    if (aiCandidates.length > 0) {
      void triggerAiReviewsForCards(aiCandidates.map((c) => c.id), boardId);
    }
  }

  // Sync parent card list with the least-advanced subtask list.
  const subtaskCards = await db.card.findMany({
    where: { id: { in: items.map((i) => i.id) }, parentCardId: { not: null } },
    select: { parentCardId: true },
  });
  const parentIds = [...new Set(subtaskCards.map((c) => c.parentCardId as string))];
  await Promise.all(parentIds.map((id) => syncParentList(id, orgId)));

  revalidatePath(`/board/${boardId}`);
  return {
    data: updatedCards,
  };
};

export const POST = toApiRoute(createSafeAction(UpdateCardOrder, handler));
