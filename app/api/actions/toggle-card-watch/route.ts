import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { ToggleCardWatch } from "@/actions/toggle-card-watch/schema";
import { InputType, ReturnType } from "@/actions/toggle-card-watch/types";
import { toApiRoute } from "@/lib/api-route";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return { error: "Unauthorized" };

  const { cardId, boardId } = data;

  const existing = await db.cardWatcher.findUnique({
    where: { cardId_userId: { cardId, userId } },
  });

  let watching: boolean;

  if (existing) {
    await db.cardWatcher.delete({ where: { id: existing.id } });
    watching = false;
  } else {
    await db.cardWatcher.create({ data: { cardId, userId } });
    watching = true;
  }

  revalidatePath(`/board/${boardId}`);
  return { data: { watching } };
};

export const POST = toApiRoute(createSafeAction(ToggleCardWatch, handler));
