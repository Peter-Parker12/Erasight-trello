import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { UpdateDisplayName } from "@/actions/manage-display-name/schema";
import type { UpdateInputType } from "@/actions/manage-display-name/types";
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

export const POST = toApiRoute(createSafeAction(UpdateDisplayName, updateHandler as any));
