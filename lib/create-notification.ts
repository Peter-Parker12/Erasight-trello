"use server";

import { db } from "@/lib/db";
import { NOTIFICATION_TYPE } from "@prisma/client";

type CreateNotificationParams = {
  userIds: string[];      // recipients
  orgId: string;
  type: NOTIFICATION_TYPE;
  message: string;
  cardId?: string;
  cardTitle?: string;
  boardId?: string;
  actorName: string;
  actorImage: string;
};

export async function createNotifications({
  userIds,
  orgId,
  type,
  message,
  cardId,
  cardTitle,
  boardId,
  actorName,
  actorImage,
}: CreateNotificationParams) {
  if (userIds.length === 0) return;

  await db.notification.createMany({
    data: userIds.map((userId) => ({
      userId,
      orgId,
      type,
      message,
      cardId: cardId ?? null,
      cardTitle: cardTitle ?? null,
      boardId: boardId ?? null,
      actorName,
      actorImage,
    })),
    skipDuplicates: false,
  });
}
