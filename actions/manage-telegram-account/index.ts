"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { UpdateTelegramAccount, RemoveTelegramAccount } from "./schema";
import type { UpdateInputType, RemoveInputType } from "./types";
import { ActionState } from "@/lib/create-safe-action";
import { UserTelegramAccount } from "@prisma/client";

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

const removeHandler = async (_data: RemoveInputType): Promise<ActionState<RemoveInputType, UserTelegramAccount | null>> => {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return { error: "Unauthorized" };

  const existing = await db.userTelegramAccount.findUnique({ where: { orgId_userId: { orgId, userId } } });
  if (!existing) return { data: null };

  await db.userTelegramAccount.delete({ where: { orgId_userId: { orgId, userId } } });
  revalidatePath("/");
  return { data: existing };
};

export const updateTelegramAccount = createSafeAction(UpdateTelegramAccount, updateHandler as any);
export const removeTelegramAccount = createSafeAction(RemoveTelegramAccount, removeHandler as any);
