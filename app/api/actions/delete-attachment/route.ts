import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { ACTION, ENTITY_TYPE } from "@prisma/client";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { createAuditLog } from "@/lib/create-audit-log";
import { toApiRoute } from "@/lib/api-route";
import { DeleteAttachment } from "@/actions/delete-attachment/schema";
import { InputType, ReturnType } from "@/actions/delete-attachment/types";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return { error: "Unauthorized" };

  const { id, boardId } = data;

  const attachment = await db.attachment.findUnique({
    where: { id },
    include: { card: { include: { list: { include: { board: true } } } } },
  });
  if (!attachment || attachment.card.list.board.orgId !== orgId) return { error: "Not found" };

  const deleted = await db.attachment.delete({ where: { id } });
  await createAuditLog({ entityId: id, entityType: ENTITY_TYPE.ATTACHMENT, entityTitle: attachment.name, action: ACTION.DELETE });
  revalidatePath(`/board/${boardId}`);
  return { data: deleted };
};

export const POST = toApiRoute(createSafeAction(DeleteAttachment, handler));
