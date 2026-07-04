import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { AddBoardMember } from "@/actions/manage-board-members/schema";
import type { AddInputType } from "@/actions/manage-board-members/types";
import { ActionState } from "@/lib/create-safe-action";
import { BoardMember } from "@prisma/client";
import { toApiRoute } from "@/lib/api-route";
import { canPerform } from "@/lib/rbac";
import { ACTIONS } from "@/lib/rbac-actions";

const addHandler = async (data: AddInputType): Promise<ActionState<AddInputType, BoardMember | null>> => {
  const { userId, orgId } = await auth();
  if (!orgId || !userId) return { error: "Unauthorized" };

  if (!(await canPerform(orgId, userId, ACTIONS.BOARD_MEMBERS_MANAGE))) {
    return { error: "Only admins can manage board members" };
  }

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

export const POST = toApiRoute(createSafeAction(AddBoardMember, addHandler as any));
