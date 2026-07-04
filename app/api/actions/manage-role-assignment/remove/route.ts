import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

import { RemoveRoleAssignment } from "@/actions/manage-role-assignment/schema";
import { RemoveInputType, RemoveReturnType } from "@/actions/manage-role-assignment/types";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { toApiRoute } from "@/lib/api-route";
import { isOrgAdmin } from "@/lib/board-access";

const handler = async (data: RemoveInputType): Promise<RemoveReturnType> => {
  const { orgId } = await auth();
  if (!orgId) return { error: "Unauthorized" };

  if (!(await isOrgAdmin(orgId))) {
    return { error: "Only admins can manage role assignments." };
  }

  try {
    await db.userRoleAssignment.delete({
      where: { orgId_userId_roleId: { orgId, userId: data.userId, roleId: data.roleId } },
    });
  } catch {
    return { data: null };
  }

  revalidatePath(`/organization/${orgId}/settings/app/roles`);
  return { data: null };
};

export const POST = toApiRoute(createSafeAction(RemoveRoleAssignment, handler));
