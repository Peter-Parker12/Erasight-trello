import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { ACTION, ENTITY_TYPE } from "@prisma/client";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { createAuditLog } from "@/lib/create-audit-log";
import { toApiRoute } from "@/lib/api-route";
import { CreateAttachment } from "@/actions/create-attachment/schema";
import { InputType, ReturnType } from "@/actions/create-attachment/types";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return { error: "Unauthorized" };

  const { cardId, boardId, name, url } = data;

  const card = await db.card.findUnique({
    where: { id: cardId },
    include: { list: { include: { board: true } } },
  });
  if (!card || card.list.board.orgId !== orgId) return { error: "Card not found" };

  const attachment = await db.attachment.create({ data: { cardId, name, url } });

  await createAuditLog({ entityId: attachment.id, entityType: ENTITY_TYPE.ATTACHMENT, entityTitle: name, action: ACTION.CREATE });
  revalidatePath(`/board/${boardId}`);
  return { data: attachment };
};

export const POST = toApiRoute(createSafeAction(CreateAttachment, handler));
