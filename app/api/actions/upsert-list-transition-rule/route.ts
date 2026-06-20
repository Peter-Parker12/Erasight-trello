import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

import { UpsertListTransitionRule } from "@/actions/upsert-list-transition-rule/schema";
import type { InputType, ReturnType } from "@/actions/upsert-list-transition-rule/types";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { toApiRoute } from "@/lib/api-route";
import { isOrgAdmin } from "@/lib/board-access";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { orgId } = await auth();
  if (!orgId) return { error: "Unauthorized" };
  if (!(await isOrgAdmin(orgId))) return { error: "Only admins can configure board settings." };

  const { boardId, listId, actions } = data;

  const list = await db.list.findUnique({ where: { id: listId, boardId, board: { orgId } } });
  if (!list) return { error: "List not found." };

  // Empty actions array means remove the rule entirely.
  if (actions.length === 0) {
    await db.listTransitionRule.deleteMany({ where: { listId } });
    revalidatePath(`/board/${boardId}`);
    return { data: null };
  }

  const rule = await db.listTransitionRule.upsert({
    where: { listId },
    create: { boardId, listId, actions },
    update: { actions },
  });

  revalidatePath(`/board/${boardId}`);
  return { data: rule };
};

export const POST = toApiRoute(createSafeAction(UpsertListTransitionRule, handler));
