import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { ACTION, ENTITY_TYPE } from "@prisma/client";

import { UpdateList } from "@/actions/update-list/schema";
import { InputType, ReturnType } from "@/actions/update-list/types";
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

  const { title, id, boardId } = data;

  let list;

  try {
    list = await db.list.update({
      where: {
        id,
        boardId,
        board: {
          orgId,
        },
      },
      data: {
        title,
      },
    });

    // create new activity log
    await createAuditLog({
      entityId: list.id,
      entityTitle: list.title,
      entityType: ENTITY_TYPE.LIST,
      action: ACTION.UPDATE,
    });
  } catch (error) {
    return {
      error: "Failed to update.",
    };
  }

  revalidatePath(`/board/${boardId}`);
  return {
    data: list,
  };
};

export const POST = toApiRoute(createSafeAction(UpdateList, handler));
