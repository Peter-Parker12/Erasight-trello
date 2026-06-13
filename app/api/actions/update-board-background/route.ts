import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { UpdateBoardBackground } from "@/actions/update-board-background/schema";
import { InputType, ReturnType } from "@/actions/update-board-background/types";
import { toApiRoute } from "@/lib/api-route";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return { error: "Unauthorized" };

  const { boardId, backgroundType, backgroundColor } = data;

  const board = await db.board.update({
    where: { id: boardId, orgId },
    data: { backgroundType, backgroundColor: backgroundColor ?? null },
  });

  revalidatePath(`/board/${boardId}`);
  return { data: board };
};

export const POST = toApiRoute(createSafeAction(UpdateBoardBackground, handler));
