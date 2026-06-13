import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { ACTION, ENTITY_TYPE } from "@prisma/client";

import { DeleteList } from "@/actions/delete-list/schema";
import { InputType, ReturnType } from "@/actions/delete-list/types";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { createAuditLog } from "@/lib/create-audit-log";
import { toApiRoute } from "@/lib/api-route";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return {
      error: "Unauthorized",
    };
  }

  const { id, boardId } = data;

  let list;

  try {
    const existing = await db.list.findUnique({
      where: { id, boardId, board: { orgId } },
    });

    if (!existing) {
      return { error: "List not found." };
    }

    if (existing.type !== "STANDARD") {
      return { error: "This default status column cannot be deleted." };
    }

    list = await db.list.delete({
      where: {
        id,
        boardId,
        board: {
          orgId,
        },
      },
    });

    // create new activity log
    await createAuditLog({
      entityId: list.id,
      entityTitle: list.title,
      entityType: ENTITY_TYPE.LIST,
      action: ACTION.DELETE,
    });
  } catch (error) {
    return {
      error: "Failed to delete.",
    };
  }

  revalidatePath(`/board/${boardId}`);

  return { data: list };
};

export const POST = toApiRoute(createSafeAction(DeleteList, handler));
