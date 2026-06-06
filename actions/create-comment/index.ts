"use server";

import { revalidatePath } from "next/cache";
import { auth, currentUser } from "@clerk/nextjs/server";
import { ACTION, ENTITY_TYPE } from "@prisma/client";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { createAuditLog } from "@/lib/create-audit-log";
import { CreateComment } from "./schema";
import { InputType, ReturnType } from "./types";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();
  const user = await currentUser();
  if (!userId || !orgId || !user) return { error: "Unauthorized" };

  const { cardId, boardId, content } = data;

  const card = await db.card.findUnique({
    where: { id: cardId },
    include: { list: { include: { board: true } } },
  });
  if (!card || card.list.board.orgId !== orgId) return { error: "Card not found" };

  const comment = await db.comment.create({
    data: {
      cardId,
      orgId,
      userId,
      content,
      userName: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.emailAddresses[0]?.emailAddress || "Unknown",
      userImage: user.imageUrl,
    },
  });

  await createAuditLog({ entityId: comment.id, entityType: ENTITY_TYPE.COMMENT, entityTitle: content.slice(0, 50), action: ACTION.CREATE });
  revalidatePath(`/board/${boardId}`);
  return { data: comment };
};

export const createComment = createSafeAction(CreateComment, handler);
