"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { UpdateTelegramConfig, RemoveTelegramConfig } from "./schema";
import type { UpdateInputType, RemoveInputType } from "./types";
import { ActionState } from "@/lib/create-safe-action";
import { BoardTelegramConfig } from "@prisma/client";
import { isOrgAdmin } from "@/lib/board-access";

const updateHandler = async (data: UpdateInputType): Promise<ActionState<UpdateInputType, BoardTelegramConfig | null>> => {
  const { orgId } = await auth();
  if (!orgId) return { error: "Unauthorized" };

  const admin = await isOrgAdmin(orgId);
  if (!admin) return { error: "Only admins can manage Telegram settings" };

  const board = await db.board.findUnique({ where: { id: data.boardId, orgId } });
  if (!board) return { error: "Board not found" };

  const config = await db.boardTelegramConfig.upsert({
    where: { boardId: data.boardId },
    update: {
      botToken: data.botToken,
      chatId: data.chatId,
      topicId: data.topicId || null,
      reviewListId: data.reviewListId || null,
      enabled: data.enabled,
    },
    create: {
      boardId: data.boardId,
      botToken: data.botToken,
      chatId: data.chatId,
      topicId: data.topicId || null,
      reviewListId: data.reviewListId || null,
      enabled: data.enabled,
    },
  });

  revalidatePath(`/board/${data.boardId}`);
  return { data: config };
};

const removeHandler = async (data: RemoveInputType): Promise<ActionState<RemoveInputType, BoardTelegramConfig | null>> => {
  const { orgId } = await auth();
  if (!orgId) return { error: "Unauthorized" };

  const admin = await isOrgAdmin(orgId);
  if (!admin) return { error: "Only admins can manage Telegram settings" };

  const board = await db.board.findUnique({ where: { id: data.boardId, orgId } });
  if (!board) return { error: "Board not found" };

  const existing = await db.boardTelegramConfig.findUnique({ where: { boardId: data.boardId } });
  if (!existing) return { data: null };

  await db.boardTelegramConfig.delete({ where: { boardId: data.boardId } });
  revalidatePath(`/board/${data.boardId}`);
  return { data: existing };
};

export const updateTelegramConfig = createSafeAction(UpdateTelegramConfig, updateHandler as any);
export const removeTelegramConfig = createSafeAction(RemoveTelegramConfig, removeHandler as any);
