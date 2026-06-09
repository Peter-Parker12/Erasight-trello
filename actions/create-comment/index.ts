"use server";

import { revalidatePath } from "next/cache";
import { auth, currentUser } from "@clerk/nextjs/server";
import { ACTION, ENTITY_TYPE } from "@prisma/client";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { createAuditLog } from "@/lib/create-audit-log";
import { createNotifications } from "@/lib/create-notification";
import { CreateComment } from "./schema";
import { InputType, ReturnType } from "./types";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();
  const user = await currentUser();
  if (!userId || !orgId || !user) return { error: "Unauthorized" };

  const { cardId, boardId, content, imageUrl } = data;

  const card = await db.card.findUnique({
    where: { id: cardId },
    include: { list: { include: { board: true } }, members: true },
  });
  if (!card || card.list.board.orgId !== orgId) return { error: "Card not found" };

  const actorName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.emailAddresses[0]?.emailAddress || "Unknown";

  const comment = await db.comment.create({
    data: {
      cardId,
      orgId,
      userId,
      content: content ?? "",
      imageUrl: imageUrl ?? null,
      userName: actorName,
      userImage: user.imageUrl,
    },
  });

  // Notify card members (except commenter)
  const recipientIds = card.members.map((m) => m.userId).filter((id) => id !== userId);
  if (recipientIds.length > 0) {
    const preview = content?.trim() ? `${content.slice(0, 80)}${content.length > 80 ? "…" : ""}` : "[image]";
    await createNotifications({
      userIds: recipientIds,
      orgId,
      type: "COMMENT_ADDED",
      message: `${actorName} commented on "${card.title}": ${preview}`,
      // @ts-ignore -- extra fields ignored below
      cardId,
      cardTitle: card.title,
      boardId,
      actorName,
      actorImage: user.imageUrl,
    });
  }

  await createAuditLog({ entityId: comment.id, entityType: ENTITY_TYPE.COMMENT, entityTitle: (content ?? "").slice(0, 50) || "[image]", action: ACTION.CREATE });
  revalidatePath(`/board/${boardId}`);
  return { data: comment };
};

export const createComment = createSafeAction(CreateComment, handler);
