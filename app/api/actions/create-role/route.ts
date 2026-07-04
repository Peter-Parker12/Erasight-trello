import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

import { CreateRole } from "@/actions/create-role/schema";
import { InputType, ReturnType } from "@/actions/create-role/types";
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

  const existing = await findRoleByNameCI(orgId, data.name);
  if (existing) return { error: "A role with this name already exists." };

  let role;

  try {
    role = await db.role.create({
      data: {
        orgId,
        name: data.name.trim(),
        description: data.description ?? null,
        actions: Array.from(new Set(data.actions)),
      },
    });
  } catch {
    return { error: "Failed to create role." };
  }

  revalidatePath(`/organization/${orgId}/settings/app/roles`);
  return { data: role };
};

export const POST = toApiRoute(createSafeAction(CreateRole, handler));
