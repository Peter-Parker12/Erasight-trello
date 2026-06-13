import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { ToggleCardLabel } from "@/actions/toggle-card-label/schema";
import { InputType, ReturnType } from "@/actions/toggle-card-label/types";
import { toApiRoute } from "@/lib/api-route";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return { error: "Unauthorized" };

  const { cardId, labelId, boardId } = data;

  const card = await db.card.findUnique({
    where: { id: cardId },
    include: { list: { include: { board: true } } },
  });
  if (!card || card.list.board.orgId !== orgId) return { error: "Card not found" };

  const existing = await db.cardLabel.findUnique({
    where: { cardId_labelId: { cardId, labelId } },
  });

  if (existing) {
    await db.cardLabel.delete({ where: { cardId_labelId: { cardId, labelId } } });
    revalidatePath(`/board/${boardId}`);
    return { data: null };
  } else {
    const created = await db.cardLabel.create({ data: { cardId, labelId } });
    revalidatePath(`/board/${boardId}`);
    return { data: created };
  }
};

export const POST = toApiRoute(createSafeAction(ToggleCardLabel, handler));
