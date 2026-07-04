import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { InputType, ReturnType } from "@/actions/create-board/types";
import { CreateBoard } from "@/actions/create-board/schema";
import { createAuditLog } from "@/lib/create-audit-log";
import { ACTION, ENTITY_TYPE } from "@prisma/client";
import { toApiRoute } from "@/lib/api-route";
import { canPerform } from "@/lib/rbac";
import { ACTIONS } from "@/lib/rbac-actions";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return {
      error: "Unauthorized",
    };
  }

  if (!(await canPerform(orgId, userId, ACTIONS.BOARD_CREATE))) {
    return {
      error: "Only organization admins or members with board-create permission can create boards.",
    };
  }

  const { title, image, workflowType } = data;

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

    if (workflowType === "KANBAN") {
      await db.list.createMany({
        data: [
          { boardId: board.id, title: "Backlog", type: "STANDARD", order: 1 },
          { boardId: board.id, title: "To Do", type: "STANDARD", order: 2 },
          { boardId: board.id, title: "In Progress", type: "STANDARD", order: 3 },
          { boardId: board.id, title: "In Review", type: "STANDARD", order: 4 },
          { boardId: board.id, title: "Done", type: "DONE", order: 5 },
          { boardId: board.id, title: "Failed", type: "FAILED", order: 6 },
          { boardId: board.id, title: "Cancelled", type: "CANCELLED", order: 7 },
        ],
      });

      const lists = await db.list.findMany({
        where: { boardId: board.id },
        select: { id: true, title: true },
      });

      const inProgressList = lists.find((l) => l.title === "In Progress");
      const inReviewList = lists.find((l) => l.title === "In Review");
      const failedList = lists.find((l) => l.title === "Failed");
      const cancelledList = lists.find((l) => l.title === "Cancelled");

      const rules = [];
      if (inProgressList) {
        rules.push({ boardId: board.id, listId: inProgressList.id, actions: ["ADD_ASSIGNEE"] });
      }
      if (inReviewList) {
        rules.push({ boardId: board.id, listId: inReviewList.id, actions: ["ADD_DUE_DATE", "ADD_ASSIGNEE"] });
      }
      if (failedList) {
        rules.push({ boardId: board.id, listId: failedList.id, actions: ["ADD_REASON"] });
      }
      if (cancelledList) {
        rules.push({ boardId: board.id, listId: cancelledList.id, actions: ["ADD_REASON"] });
      }

      if (rules.length > 0) {
        await db.listTransitionRule.createMany({
          data: rules,
        });
      }
    } else {
      await db.list.createMany({
        data: [
          { boardId: board.id, title: "Done", type: "DONE", order: 100000 },
          { boardId: board.id, title: "Failed", type: "FAILED", order: 100001 },
          { boardId: board.id, title: "Cancelled", type: "CANCELLED", order: 100002 },
        ],
      });
    }
  } catch (error) {
    return {
      error: "Failed to create",
    };
  }

  revalidatePath(`/board/${board.id}`);
  return { data: board };
};

export const POST = toApiRoute(createSafeAction(CreateBoard, handler));
