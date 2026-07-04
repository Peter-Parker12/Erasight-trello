import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { UpdateTelegramConfig } from "@/actions/manage-telegram-config/schema";
import type { UpdateInputType } from "@/actions/manage-telegram-config/types";
import { ActionState } from "@/lib/create-safe-action";
import { BoardTelegramConfig } from "@prisma/client";
import { toApiRoute } from "@/lib/api-route";
import { canPerform } from "@/lib/rbac";
import { ACTIONS } from "@/lib/rbac-actions";

const updateHandler = async (data: UpdateInputType): Promise<ActionState<UpdateInputType, BoardTelegramConfig | null>> => {
  const { userId, orgId } = await auth();
  if (!orgId || !userId) return { error: "Unauthorized" };

  if (!(await canPerform(orgId, userId, ACTIONS.BOARD_TELEGRAM_MANAGE))) {
    return { error: "Only admins can manage Telegram settings" };
  }

  const board = await db.board.findUnique({ where: { id: data.boardId, orgId } });
  if (!board) return { error: "Board not found" };

  const config = await db.boardTelegramConfig.upsert({
    where: { boardId: data.boardId },
    update: {
      botToken: data.botToken,
      chatId: data.chatId,
      topicId: data.topicId || null,
      enabled: data.enabled,
    },
    create: {
      boardId: data.boardId,
      botToken: data.botToken,
      chatId: data.chatId,
      topicId: data.topicId || null,
      enabled: data.enabled,
    },
  });

  revalidatePath(`/board/${data.boardId}`);
  return { data: config };
};

export const POST = toApiRoute(createSafeAction(UpdateTelegramConfig, updateHandler as any));
