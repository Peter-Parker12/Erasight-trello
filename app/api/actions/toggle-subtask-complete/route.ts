import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { ToggleSubtaskComplete } from "@/actions/toggle-subtask-complete/schema";
import { InputType, ReturnType } from "@/actions/toggle-subtask-complete/types";
import { toApiRoute } from "@/lib/api-route";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return { error: "Unauthorized" };

  const { id, boardId, completed } = data;

  let card;
  try {
    card = await db.card.update({
      where: {
        id,
        list: { board: { orgId } },
      },
      data: { completed },
    });
  } catch {
    return { error: "Failed to update subtask." };
  }

  revalidatePath(`/board/${boardId}`);
  return { data: card };
};

export const POST = toApiRoute(createSafeAction(ToggleSubtaskComplete, handler));
