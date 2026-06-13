import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { ACTION, ENTITY_TYPE } from "@prisma/client";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { createAuditLog } from "@/lib/create-audit-log";
import { toApiRoute } from "@/lib/api-route";
import { CreateChecklist } from "@/actions/create-checklist/schema";
import { InputType, ReturnType } from "@/actions/create-checklist/types";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return { error: "Unauthorized" };

  const { cardId, boardId, title } = data;

  const card = await db.card.findUnique({
    where: { id: cardId },
    include: { list: { include: { board: true } } },
  });
  if (!card || card.list.board.orgId !== orgId) return { error: "Card not found" };

  const count = await db.checklist.count({ where: { cardId } });
  const checklist = await db.checklist.create({ data: { cardId, title, order: count } });

  await createAuditLog({ entityId: checklist.id, entityType: ENTITY_TYPE.CHECKLIST, entityTitle: title, action: ACTION.CREATE });
  revalidatePath(`/board/${boardId}`);
  return { data: checklist };
};

export const POST = toApiRoute(createSafeAction(CreateChecklist, handler));
