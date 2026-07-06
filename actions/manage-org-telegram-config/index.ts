"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { isOrgAdmin } from "@/lib/board-access";
import { UpdateOrgTelegramConfig, RemoveOrgTelegramConfig } from "./schema";
import type {
  UpdateInputType,
  UpdateReturnType,
  RemoveInputType,
  RemoveReturnType,
} from "./types";

const updateHandler = async (data: UpdateInputType): Promise<UpdateReturnType> => {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return { error: "Unauthorized" };

  const admin = await isOrgAdmin(orgId);
  if (!admin) return { error: "Only admins can manage Telegram settings." };

  const config = await db.orgTelegramConfig.upsert({
    where: { orgId },
    update: {
      botToken: data.botToken,
      chatId: data.chatId,
      topicId: data.topicId || null,
      enabled: data.enabled,
    },
    create: {
      orgId,
      botToken: data.botToken,
      chatId: data.chatId,
      topicId: data.topicId || null,
      enabled: data.enabled,
    },
  });

  revalidatePath(`/organization/${orgId}/dashboard/okrs`, "layout");
  return { data: config };
};

const removeHandler = async (_data: RemoveInputType): Promise<RemoveReturnType> => {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return { error: "Unauthorized" };

  const admin = await isOrgAdmin(orgId);
  if (!admin) return { error: "Only admins can manage Telegram settings." };

  const existing = await db.orgTelegramConfig.findUnique({ where: { orgId } });
  if (!existing) return { data: null };

  await db.orgTelegramConfig.delete({ where: { orgId } });
  revalidatePath(`/organization/${orgId}/dashboard/okrs`, "layout");
  return { data: existing };
};

export const updateOrgTelegramConfig = createSafeAction(
  UpdateOrgTelegramConfig,
  updateHandler
);
export const removeOrgTelegramConfig = createSafeAction(
  RemoveOrgTelegramConfig,
  removeHandler
);
