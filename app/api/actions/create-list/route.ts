import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { ACTION, ENTITY_TYPE } from "@prisma/client";

import { CreateList } from "@/actions/create-list/schema";
import { InputType, ReturnType } from "@/actions/create-list/types";
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

  const { title, boardId } = data;

  let list;

  try {
    const board = await db.board.findUnique({
      where: {
        id: boardId,
        orgId,
      },
    });

    if (!board)
      return {
        error: "Board not found",
      };

    const lastList = await db.list.findFirst({
      where: {
        boardId,
        type: "STANDARD",
      },
      orderBy: {
        order: "desc",
      },
      select: { order: true },
    });

    const newOrder = lastList ? lastList.order + 1 : 1;

    list = await db.list.create({
      data: {
        title,
        boardId,
        order: newOrder,
      },
    });

    // create new activity log
    await createAuditLog({
      entityId: list.id,
      entityTitle: list.title,
      entityType: ENTITY_TYPE.LIST,
      action: ACTION.CREATE,
    });
  } catch (error) {
    return {
      error: "Failed to create.",
    };
  }

  revalidatePath(`/board/${boardId}`);

  return {
    data: list,
  };
};

export const POST = toApiRoute(createSafeAction(CreateList, handler));
