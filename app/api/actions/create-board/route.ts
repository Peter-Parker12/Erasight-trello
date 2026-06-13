import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { InputType, ReturnType } from "@/actions/create-board/types";
import { CreateBoard } from "@/actions/create-board/schema";
import { createAuditLog } from "@/lib/create-audit-log";
import { isOrgAdmin } from "@/lib/board-access";
import { ACTION, ENTITY_TYPE } from "@prisma/client";
import { toApiRoute } from "@/lib/api-route";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return {
      error: "Unauthorized",
    };
  }

  const admin = await isOrgAdmin(orgId);
  if (!admin) {
    return {
      error: "Only organization admins can create boards.",
    };
  }

  const { title, image } = data;

  const [imageId, imageThumbUrl, imageFullUrl, imageLinkHtml, imageUserName] =
    image.split("|");

  if (
    !imageId ||
    !imageThumbUrl ||
    !imageFullUrl ||
    !imageLinkHtml ||
    !imageUserName
  ) {
    return {
      error: "Missing fields. Failed to create board.",
    };
  }

  let board;

  try {
    board = await db.board.create({
      data: {
        title,
        orgId,
        imageId,
        imageThumbUrl,
        imageFullUrl,
        imageUserName,
        imageLinkHtml,
      },
    });

    await createAuditLog({
      entityId: board.id,
      entityTitle: board.title,
      entityType: ENTITY_TYPE.BOARD,
      action: ACTION.CREATE,
    });

    await db.list.createMany({
      data: [
        { boardId: board.id, title: "Done", type: "DONE", order: 100000 },
        { boardId: board.id, title: "Failed", type: "FAILED", order: 100001 },
        { boardId: board.id, title: "Cancelled", type: "CANCELLED", order: 100002 },
      ],
    });
  } catch (error) {
    return {
      error: "Failed to create",
    };
  }

  revalidatePath(`/board/${board.id}`);
  return { data: board };
};

export const POST = toApiRoute(createSafeAction(CreateBoard, handler));
