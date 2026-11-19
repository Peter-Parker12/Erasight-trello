import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { UpdateZaloAccount } from "@/actions/manage-zalo-account/schema";
import type { UpdateInputType } from "@/actions/manage-zalo-account/types";
import { ActionState } from "@/lib/create-safe-action";
import { UserZaloAccount } from "@prisma/client";
import { toApiRoute } from "@/lib/api-route";

const updateHandler = async (data: UpdateInputType): Promise<ActionState<UpdateInputType, UserZaloAccount | null>> => {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return { error: "Unauthorized" };

  const account = await db.userZaloAccount.upsert({
    where: { orgId_userId: { orgId, userId } },
    update: { zaloName: data.zaloName },
    create: { orgId, userId, zaloName: data.zaloName },
  });

  revalidatePath("/");
  return { data: account };
};

export const POST = toApiRoute(createSafeAction(UpdateZaloAccount, updateHandler as any));
