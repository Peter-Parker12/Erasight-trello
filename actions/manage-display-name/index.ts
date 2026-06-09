"use server";

import { revalidatePath } from "next/cache";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { UpdateDisplayName, RemoveDisplayName } from "./schema";
import type { UpdateInputType, RemoveInputType } from "./types";
import { ActionState } from "@/lib/create-safe-action";
import { UserDisplayName } from "@prisma/client";

async function cascadeUpdateName(orgId: string, userId: string, name: string) {
  const [boards, cards] = await Promise.all([
    db.board.findMany({ where: { orgId }, select: { id: true } }),
    db.card.findMany({ where: { list: { board: { orgId } } }, select: { id: true } }),
  ]);

  await Promise.all([
    db.boardMember.updateMany({
      where: { userId, boardId: { in: boards.map((b) => b.id) } },
      data: { userName: name },
    }),
    db.cardMember.updateMany({
      where: { userId, cardId: { in: cards.map((c) => c.id) } },
      data: { userName: name },
    }),
  ]);
}

const updateHandler = async (data: UpdateInputType): Promise<ActionState<UpdateInputType, UserDisplayName | null>> => {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return { error: "Unauthorized" };

  const record = await db.userDisplayName.upsert({
    where: { orgId_userId: { orgId, userId } },
    update: { displayName: data.displayName },
    create: { orgId, userId, displayName: data.displayName },
  });

  await cascadeUpdateName(orgId, userId, data.displayName);

  revalidatePath("/");
  return { data: record };
};

const removeHandler = async (_data: RemoveInputType): Promise<ActionState<RemoveInputType, UserDisplayName | null>> => {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return { error: "Unauthorized" };

  const existing = await db.userDisplayName.findUnique({
    where: { orgId_userId: { orgId, userId } },
  });
  if (!existing) return { data: null };

  await db.userDisplayName.delete({ where: { orgId_userId: { orgId, userId } } });

  // Revert to Clerk name
  const clerk = await clerkClient();
  const clerkUser = await clerk.users.getUser(userId);
  const clerkName = `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() || "Unknown";

  await cascadeUpdateName(orgId, userId, clerkName);

  revalidatePath("/");
  return { data: existing };
};

export const updateDisplayName = createSafeAction(UpdateDisplayName, updateHandler as any);
export const removeDisplayName = createSafeAction(RemoveDisplayName, removeHandler as any);
