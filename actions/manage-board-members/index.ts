"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { AddBoardMember, RemoveBoardMember } from "./schema";
import type { AddInputType, RemoveInputType } from "./types";
import { ActionState } from "@/lib/create-safe-action";
import { BoardMember } from "@prisma/client";
import { isOrgAdmin } from "@/lib/board-access";

const addHandler = async (data: AddInputType): Promise<ActionState<AddInputType, BoardMember | null>> => {
  const { orgId } = await auth();
  if (!orgId) return { error: "Unauthorized" };

  const admin = await isOrgAdmin(orgId);
  if (!admin) return { error: "Only admins can manage board members" };

  const board = await db.board.findUnique({ where: { id: data.boardId, orgId } });
  if (!board) return { error: "Board not found" };

  const existing = await db.boardMember.findUnique({
    where: { boardId_userId: { boardId: data.boardId, userId: data.userId } },
  });
  if (existing) return { data: existing };

  const member = await db.boardMember.create({
    data: { boardId: data.boardId, userId: data.userId, userName: data.userName, userImage: data.userImage },
  });
  revalidatePath(`/board/${data.boardId}`);
  return { data: member };
};

const removeHandler = async (data: RemoveInputType): Promise<ActionState<RemoveInputType, BoardMember | null>> => {
  const { orgId } = await auth();
  if (!orgId) return { error: "Unauthorized" };

  const admin = await isOrgAdmin(orgId);
  if (!admin) return { error: "Only admins can manage board members" };

  const board = await db.board.findUnique({ where: { id: data.boardId, orgId } });
  if (!board) return { error: "Board not found" };

  const existing = await db.boardMember.findUnique({
    where: { boardId_userId: { boardId: data.boardId, userId: data.userId } },
  });
  if (!existing) return { data: null };

  await db.boardMember.delete({ where: { boardId_userId: { boardId: data.boardId, userId: data.userId } } });
  revalidatePath(`/board/${data.boardId}`);
  return { data: existing };
};

export const addBoardMember = createSafeAction(AddBoardMember, addHandler as any);
export const removeBoardMember = createSafeAction(RemoveBoardMember, removeHandler as any);
