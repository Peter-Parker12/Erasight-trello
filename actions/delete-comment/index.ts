"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { ACTION, ENTITY_TYPE } from "@prisma/client";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { createAuditLog } from "@/lib/create-audit-log";
import { DeleteComment } from "./schema";
import { InputType, ReturnType } from "./types";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return { error: "Unauthorized" };

  const { id, boardId } = data;

  const comment = await db.comment.findUnique({
    where: { id },
    include: { card: { include: { list: { include: { board: true } } } } },
  });
  if (!comment) return { error: "Comment not found" };
  if (comment.userId !== userId && comment.card.list.board.orgId !== orgId) return { error: "Unauthorized" };

  const deleted = await db.comment.delete({ where: { id } });
  await createAuditLog({ entityId: id, entityType: ENTITY_TYPE.COMMENT, entityTitle: comment.content.slice(0, 50), action: ACTION.DELETE });
  revalidatePath(`/board/${boardId}`);
  return { data: deleted };
};

export const deleteComment = createSafeAction(DeleteComment, handler);
