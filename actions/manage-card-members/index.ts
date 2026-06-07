"use server";

import { revalidatePath } from "next/cache";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { AddCardMember, RemoveCardMember } from "./schema";
import type { AddInputType, RemoveInputType } from "./types";
import { ActionState } from "@/lib/create-safe-action";
import { CardMember } from "@prisma/client";
import { notifyCardAssigned } from "@/lib/board-telegram";
import { createNotifications } from "@/lib/create-notification";

const addHandler = async (data: AddInputType): Promise<ActionState<AddInputType, CardMember | null>> => {
  const { userId, orgId } = await auth();
  const actor = await currentUser();
  if (!userId || !orgId || !actor) return { error: "Unauthorized" };

  const { cardId, boardId, userId: memberId, userName, userImage } = data;

  const card = await db.card.findUnique({
    where: { id: cardId },
    include: { list: { include: { board: true } } },
  });
  if (!card || card.list.board.orgId !== orgId) return { error: "Card not found" };

  const existing = await db.cardMember.findUnique({ where: { cardId_userId: { cardId, userId: memberId } } });
  if (existing) return { data: existing };

  const member = await db.cardMember.create({ data: { cardId, userId: memberId, userName, userImage } });

  await notifyCardAssigned({
    boardId,
    orgId,
    cardId: card.id,
    cardTitle: card.title,
    assigneeUserId: memberId,
    assigneeName: userName,
  });

  // Notify assigned member (skip self-assign)
  if (memberId !== userId) {
    const actorName = `${actor.firstName ?? ""} ${actor.lastName ?? ""}`.trim() || "Someone";
    await createNotifications({
      userIds: [memberId],
      orgId,
      type: "CARD_ASSIGNED",
      message: `${actorName} assigned you to "${card.title}"`,
      cardId,
      cardTitle: card.title,
      boardId,
      actorName,
      actorImage: actor.imageUrl,
    });
  }

  revalidatePath(`/board/${boardId}`);
  return { data: member };
};

const removeHandler = async (data: RemoveInputType): Promise<ActionState<RemoveInputType, CardMember | null>> => {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return { error: "Unauthorized" };

  const { cardId, boardId, userId: memberId } = data;

  const card = await db.card.findUnique({
    where: { id: cardId },
    include: { list: { include: { board: true } } },
  });
  if (!card || card.list.board.orgId !== orgId) return { error: "Card not found" };

  const existing = await db.cardMember.findUnique({ where: { cardId_userId: { cardId, userId: memberId } } });
  if (!existing) return { data: null };

  await db.cardMember.delete({ where: { cardId_userId: { cardId, userId: memberId } } });
  revalidatePath(`/board/${boardId}`);
  return { data: existing };
};

export const addCardMember = createSafeAction(AddCardMember, addHandler as any);
export const removeCardMember = createSafeAction(RemoveCardMember, removeHandler as any);
