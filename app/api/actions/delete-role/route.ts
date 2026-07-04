import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

import { DeleteRole } from "@/actions/delete-role/schema";
import { InputType, ReturnType } from "@/actions/delete-role/types";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { toApiRoute } from "@/lib/api-route";
import { isOrgAdmin } from "@/lib/board-access";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { orgId } = await auth();
  if (!orgId) return { error: "Unauthorized" };

  if (!(await isOrgAdmin(orgId))) {
    return { error: "Only admins can manage roles." };
  }

  let role;

  try {
    role = await db.role.delete({
      where: { id: data.id, orgId },
    });
  } catch {
    return { error: "Failed to delete role." };
  }

  revalidatePath(`/organization/${orgId}/settings/app/roles`);
  return { data: role };
};

export const POST = toApiRoute(createSafeAction(DeleteRole, handler));
