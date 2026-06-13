import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { UpdateListWip } from "@/actions/update-list-wip/schema";
import { InputType, ReturnType } from "@/actions/update-list-wip/types";
import { toApiRoute } from "@/lib/api-route";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return { error: "Unauthorized" };

  const { id, boardId, wipLimit } = data;

  const list = await db.list.update({
    where: { id, board: { orgId } },
    data: { wipLimit },
  });

  revalidatePath(`/board/${boardId}`);
  return { data: list };
};

export const POST = toApiRoute(createSafeAction(UpdateListWip, handler));
