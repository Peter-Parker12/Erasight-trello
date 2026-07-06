import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

import { AdminSetTelegramAccount } from "@/actions/admin-set-telegram-account/schema";
import { InputType, ReturnType } from "@/actions/admin-set-telegram-account/types";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { toApiRoute } from "@/lib/api-route";
import { isOrgAdmin } from "@/lib/board-access";
import { normalizeTelegramUsername } from "@/lib/telegram";

// Admin-only: set/fix any member's Telegram username so their reports can be
// captured even before they self-link. Mirrors manage-telegram-account/update
// but targets an arbitrary userId.
const handler = async (data: InputType): Promise<ReturnType> => {
  const { orgId } = await auth();
  if (!orgId) return { error: "Unauthorized" };

  if (!(await isOrgAdmin(orgId))) {
    return { error: "Only admins can set a member's Telegram username." };
  }

  const telegramUsername = normalizeTelegramUsername(data.telegramUsername);

  let account;
  try {
    account = await db.userTelegramAccount.upsert({
      where: { orgId_userId: { orgId, userId: data.userId } },
      update: { telegramUsername },
      create: { orgId, userId: data.userId, telegramUsername },
    });
  } catch {
    return { error: "Failed to set Telegram username." };
  }

  revalidatePath(`/organization/${orgId}/dashboard/daily-report`);
  return { data: account };
};

export const POST = toApiRoute(createSafeAction(AdminSetTelegramAccount, handler));
