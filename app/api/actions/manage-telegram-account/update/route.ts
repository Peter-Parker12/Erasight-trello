import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { UpdateTelegramAccount } from "@/actions/manage-telegram-account/schema";
import type { UpdateInputType } from "@/actions/manage-telegram-account/types";
import { ActionState } from "@/lib/create-safe-action";
import { UserTelegramAccount } from "@prisma/client";
import { toApiRoute } from "@/lib/api-route";

const updateHandler = async (data: UpdateInputType): Promise<ActionState<UpdateInputType, UserTelegramAccount | null>> => {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return { error: "Unauthorized" };

  const account = await db.userTelegramAccount.upsert({
    where: { orgId_userId: { orgId, userId } },
    update: { telegramUsername: data.telegramUsername },
    create: { orgId, userId, telegramUsername: data.telegramUsername },
  });

  revalidatePath("/");
  return { data: account };
};

export const POST = toApiRoute(createSafeAction(UpdateTelegramAccount, updateHandler as any));
