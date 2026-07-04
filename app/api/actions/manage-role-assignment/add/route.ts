import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

import { AddRoleAssignment } from "@/actions/manage-role-assignment/schema";
import { AddInputType, AddReturnType } from "@/actions/manage-role-assignment/types";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { toApiRoute } from "@/lib/api-route";
import { isOrgAdmin } from "@/lib/board-access";

const handler = async (data: AddInputType): Promise<AddReturnType> => {
  const { orgId } = await auth();
  if (!orgId) return { error: "Unauthorized" };

  if (!(await isOrgAdmin(orgId))) {
    return { error: "Only admins can manage role assignments." };
  }

  const role = await db.role.findFirst({ where: { id: data.roleId, orgId } });
  if (!role) return { error: "Role not found." };

  const existing = await db.userRoleAssignment.findUnique({
    where: { orgId_userId_roleId: { orgId, userId: data.userId, roleId: data.roleId } },
  });
  if (existing) return { data: existing };

  let assignment;

  try {
    assignment = await db.userRoleAssignment.create({
      data: { orgId, userId: data.userId, roleId: data.roleId },
    });
  } catch {
    return { error: "Failed to assign role." };
  }

  revalidatePath(`/organization/${orgId}/settings/app/roles`);
  return { data: assignment };
};

export const POST = toApiRoute(createSafeAction(AddRoleAssignment, handler));
