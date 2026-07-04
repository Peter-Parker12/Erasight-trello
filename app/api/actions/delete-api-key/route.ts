import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

import { DeleteApiKey } from "@/actions/delete-api-key/schema";
import { InputType, ReturnType } from "@/actions/delete-api-key/types";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { toApiRoute } from "@/lib/api-route";
import { canPerform } from "@/lib/rbac";
import { ACTIONS } from "@/lib/rbac-actions";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();
  if (!orgId || !userId) return { error: "Unauthorized" };

  if (!(await canPerform(orgId, userId, ACTIONS.ORG_API_KEYS_MANAGE))) {
    return { error: "Only admins can manage API keys." };
  }

  let apiKey;

  try {
    apiKey = await db.apiKey.delete({
      where: { id: data.id, orgId },
    });
  } catch {
    return { error: "Failed to delete API key." };
  }

  revalidatePath(`/organization/${orgId}/settings/app/api-keys`);
  return { data: apiKey };
};

export const POST = toApiRoute(createSafeAction(DeleteApiKey, handler));
