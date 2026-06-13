import { revalidatePath } from "next/cache";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { RemoveDisplayName } from "@/actions/manage-display-name/schema";
import type { RemoveInputType } from "@/actions/manage-display-name/types";
import { ActionState } from "@/lib/create-safe-action";
import { UserDisplayName } from "@prisma/client";
import { toApiRoute } from "@/lib/api-route";

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

export const POST = toApiRoute(createSafeAction(RemoveDisplayName, removeHandler as any));
