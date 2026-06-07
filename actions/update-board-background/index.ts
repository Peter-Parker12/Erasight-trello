"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { UpdateBoardBackground } from "./schema";
import { InputType, ReturnType } from "./types";

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

export const updateBoardBackground = createSafeAction(UpdateBoardBackground, handler);
