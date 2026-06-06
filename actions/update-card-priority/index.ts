"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { ACTION, ENTITY_TYPE } from "@prisma/client";

import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { createAuditLog } from "@/lib/create-audit-log";
import { UpdateCardPriority } from "./schema";
import { InputType, ReturnType } from "./types";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return { error: "Unauthorized" };

  const { id, boardId, priority } = data;

  const card = await db.card.findUnique({
    where: { id },
    include: { list: { include: { board: true } } },
  });
  if (!card || card.list.board.orgId !== orgId) return { error: "Card not found" };

  const updated = await db.card.update({ where: { id }, data: { priority } });

  await createAuditLog({ entityId: id, entityType: ENTITY_TYPE.CARD, entityTitle: card.title, action: ACTION.UPDATE });
  revalidatePath(`/board/${boardId}`);
  return { data: updated };
};

export const updateCardPriority = createSafeAction(UpdateCardPriority, handler);
