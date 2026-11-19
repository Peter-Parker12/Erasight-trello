import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { RemoveZaloAccount } from "@/actions/manage-zalo-account/schema";
import type { RemoveInputType } from "@/actions/manage-zalo-account/types";
import { ActionState } from "@/lib/create-safe-action";
import { UserZaloAccount } from "@prisma/client";
import { toApiRoute } from "@/lib/api-route";

const removeHandler = async (_data: RemoveInputType): Promise<ActionState<RemoveInputType, UserZaloAccount | null>> => {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return { error: "Unauthorized" };

  const existing = await db.userZaloAccount.findUnique({ where: { orgId_userId: { orgId, userId } } });
  if (!existing) return { data: null };

  await db.userZaloAccount.delete({ where: { orgId_userId: { orgId, userId } } });
  revalidatePath("/");
  return { data: existing };
};

export const POST = toApiRoute(createSafeAction(RemoveZaloAccount, removeHandler as any));
