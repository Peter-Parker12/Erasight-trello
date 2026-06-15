import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

import { RemoveModuleAccess } from "@/actions/manage-module-access/schema";
import { RemoveInputType, RemoveReturnType } from "@/actions/manage-module-access/types";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { toApiRoute } from "@/lib/api-route";
import { isOrgAdmin } from "@/lib/board-access";
import { isModuleKey } from "@/lib/modules";

const handler = async (data: RemoveInputType): Promise<RemoveReturnType> => {
  const { orgId } = await auth();
  if (!orgId) return { error: "Unauthorized" };

  if (!(await isOrgAdmin(orgId))) {
    return { error: "Only admins can manage module access." };
  }

  if (!isModuleKey(data.module)) {
    return { error: "Unknown module." };
  }

  try {
    await db.moduleAccess.delete({
      where: { orgId_userId_module: { orgId, userId: data.userId, module: data.module } },
    });
  } catch {
    return { data: null };
  }

  revalidatePath(`/organization/${orgId}/settings/app/modules`);
  return { data: null };
};

export const POST = toApiRoute(createSafeAction(RemoveModuleAccess, handler));
