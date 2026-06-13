import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { RemoveTelegramAccount } from "@/actions/manage-telegram-account/schema";
import type { RemoveInputType } from "@/actions/manage-telegram-account/types";
import { ActionState } from "@/lib/create-safe-action";
import { UserTelegramAccount } from "@prisma/client";
import { toApiRoute } from "@/lib/api-route";

const removeHandler = async (_data: RemoveInputType): Promise<ActionState<RemoveInputType, UserTelegramAccount | null>> => {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return { error: "Unauthorized" };

  const existing = await db.userTelegramAccount.findUnique({ where: { orgId_userId: { orgId, userId } } });
  if (!existing) return { data: null };

  await db.userTelegramAccount.delete({ where: { orgId_userId: { orgId, userId } } });
  revalidatePath("/");
  return { data: existing };
};

export const POST = toApiRoute(createSafeAction(RemoveTelegramAccount, removeHandler as any));
