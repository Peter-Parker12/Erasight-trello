import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

import { AddModuleAccess } from "@/actions/manage-module-access/schema";
import { AddInputType, AddReturnType } from "@/actions/manage-module-access/types";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { toApiRoute } from "@/lib/api-route";
import { isOrgAdmin } from "@/lib/board-access";
import { isModuleKey } from "@/lib/modules";

const handler = async (data: AddInputType): Promise<AddReturnType> => {
  const { orgId } = await auth();
  if (!orgId) return { error: "Unauthorized" };

  if (!(await isOrgAdmin(orgId))) {
    return { error: "Only admins can manage module access." };
  }

  if (!isModuleKey(data.module)) {
    return { error: "Unknown module." };
  }

  const existing = await db.moduleAccess.findUnique({
    where: { orgId_userId_module: { orgId, userId: data.userId, module: data.module } },
  });
  if (existing) return { data: existing };

  let access;

  try {
    access = await db.moduleAccess.create({
      data: { orgId, userId: data.userId, module: data.module },
    });
  } catch {
    return { error: "Failed to grant access." };
  }

  revalidatePath(`/organization/${orgId}/settings/app/modules`);
  return { data: access };
};

export const POST = toApiRoute(createSafeAction(AddModuleAccess, handler));
