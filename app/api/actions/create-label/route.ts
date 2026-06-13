import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { toApiRoute } from "@/lib/api-route";
import { CreateLabel } from "@/actions/create-label/schema";
import { InputType, ReturnType } from "@/actions/create-label/types";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return { error: "Unauthorized" };

  const { boardId, name, color } = data;

  const board = await db.board.findUnique({ where: { id: boardId, orgId } });
  if (!board) return { error: "Board not found" };

  const label = await db.label.create({ data: { boardId, name, color } });

  revalidatePath(`/board/${boardId}`);
  return { data: label };
};

export const POST = toApiRoute(createSafeAction(CreateLabel, handler));
