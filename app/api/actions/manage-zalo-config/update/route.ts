import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { UpdateZaloConfig } from "@/actions/manage-zalo-config/schema";
import type { UpdateInputType } from "@/actions/manage-zalo-config/types";
import { ActionState } from "@/lib/create-safe-action";
import { BoardZaloConfig } from "@prisma/client";
import { toApiRoute } from "@/lib/api-route";
import { canPerform } from "@/lib/rbac";
import { ACTIONS } from "@/lib/rbac-actions";

const updateHandler = async (data: UpdateInputType): Promise<ActionState<UpdateInputType, BoardZaloConfig | null>> => {
  const { userId, orgId } = await auth();
  if (!orgId || !userId) return { error: "Unauthorized" };

  if (!(await canPerform(orgId, userId, ACTIONS.BOARD_ZALO_MANAGE))) {
    return { error: "Only admins can manage Zalo settings" };
  }

  const board = await db.board.findUnique({ where: { id: data.boardId, orgId } });
  if (!board) return { error: "Board not found" };

  const fields = { botToken: data.botToken, chatId: data.chatId, enabled: data.enabled };
  const config = await db.boardZaloConfig.upsert({
    where: { boardId: data.boardId },
    update: fields,
    create: { boardId: data.boardId, ...fields },
  });

  revalidatePath(`/board/${data.boardId}`);
  return { data: config };
};

export const POST = toApiRoute(createSafeAction(UpdateZaloConfig, updateHandler as any));
