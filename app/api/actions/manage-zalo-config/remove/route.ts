import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { RemoveZaloConfig } from "@/actions/manage-zalo-config/schema";
import type { RemoveInputType } from "@/actions/manage-zalo-config/types";
import { ActionState } from "@/lib/create-safe-action";
import { BoardZaloConfig } from "@prisma/client";
import { toApiRoute } from "@/lib/api-route";
import { canPerform } from "@/lib/rbac";
import { ACTIONS } from "@/lib/rbac-actions";

const removeHandler = async (data: RemoveInputType): Promise<ActionState<RemoveInputType, BoardZaloConfig | null>> => {
  const { userId, orgId } = await auth();
  if (!orgId || !userId) return { error: "Unauthorized" };

  if (!(await canPerform(orgId, userId, ACTIONS.BOARD_ZALO_MANAGE))) {
    return { error: "Only admins can manage Zalo settings" };
  }

  const board = await db.board.findUnique({ where: { id: data.boardId, orgId } });
  if (!board) return { error: "Board not found" };

  const existing = await db.boardZaloConfig.findUnique({ where: { boardId: data.boardId } });
  if (!existing) return { data: null };

  await db.boardZaloConfig.delete({ where: { boardId: data.boardId } });
  revalidatePath(`/board/${data.boardId}`);
  return { data: existing };
};

export const POST = toApiRoute(createSafeAction(RemoveZaloConfig, removeHandler as any));
