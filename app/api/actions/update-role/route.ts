import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

import { UpdateRole } from "@/actions/update-role/schema";
import { InputType, ReturnType } from "@/actions/update-role/types";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { toApiRoute } from "@/lib/api-route";
import { isOrgAdmin } from "@/lib/board-access";
import { findRoleByNameCI } from "@/lib/rbac";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { orgId } = await auth();
  if (!orgId) return { error: "Unauthorized" };

  if (!(await isOrgAdmin(orgId))) {
    return { error: "Only admins can manage roles." };
  }

  if (data.name !== undefined) {
    const existing = await findRoleByNameCI(orgId, data.name, data.id);
    if (existing) return { error: "A role with this name already exists." };
  }

  let role;

  try {
    role = await db.role.update({
      where: { id: data.id, orgId },
      data: {
        ...(data.name !== undefined ? { name: data.name.trim() } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.actions !== undefined ? { actions: Array.from(new Set(data.actions)) } : {}),
      },
    });
  } catch {
    return { error: "Role not found." };
  }

  revalidatePath(`/organization/${orgId}/settings/app/roles`);
  return { data: role };
};

export const POST = toApiRoute(createSafeAction(UpdateRole, handler));
