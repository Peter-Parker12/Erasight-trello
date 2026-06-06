"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { ACTION, ENTITY_TYPE } from "@prisma/client";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { createAuditLog } from "@/lib/create-audit-log";
import { DeleteChecklist } from "./schema";
import { InputType, ReturnType } from "./types";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return { error: "Unauthorized" };

  const { id, boardId } = data;

  const checklist = await db.checklist.findUnique({
    where: { id },
    include: { card: { include: { list: { include: { board: true } } } } },
  });
  if (!checklist || checklist.card.list.board.orgId !== orgId) return { error: "Not found" };

  const deleted = await db.checklist.delete({ where: { id } });
  await createAuditLog({ entityId: id, entityType: ENTITY_TYPE.CHECKLIST, entityTitle: checklist.title, action: ACTION.DELETE });
  revalidatePath(`/board/${boardId}`);
  return { data: deleted };
};

export const deleteChecklist = createSafeAction(DeleteChecklist, handler);
