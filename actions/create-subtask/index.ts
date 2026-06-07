"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { CreateSubtask } from "./schema";
import { InputType, ReturnType } from "./types";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return { error: "Unauthorized" };

  const { title, parentCardId, listId, boardId } = data;

  const lastCard = await db.card.findFirst({
    where: { listId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const card = await db.card.create({
    data: {
      title,
      listId,
      order: (lastCard?.order ?? 0) + 1,
      parentCardId,
    },
  });

  revalidatePath(`/board/${boardId}`);
  return { data: card };
};

export const createSubtask = createSafeAction(CreateSubtask, handler);
