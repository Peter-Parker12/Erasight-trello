import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

import { CreateApiKey } from "@/actions/create-api-key/schema";
import { InputType, ReturnType } from "@/actions/create-api-key/types";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { toApiRoute } from "@/lib/api-route";
import { generateApiKey } from "@/lib/api-keys";
import { canPerform } from "@/lib/rbac";
import { ACTIONS } from "@/lib/rbac-actions";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return { error: "Unauthorized" };

  if (!(await canPerform(orgId, userId, ACTIONS.ORG_API_KEYS_MANAGE))) {
    return { error: "Only admins can manage API keys." };
  }

  const { key, keyPrefix, hashedKey } = generateApiKey();

  let apiKey;

  try {
    apiKey = await db.apiKey.create({
      data: {
        orgId,
        name: data.name,
        keyPrefix,
        hashedKey,
        createdBy: userId,
      },
    });
  } catch {
    return { error: "Failed to create API key." };
  }

  revalidatePath(`/organization/${orgId}/settings/app/api-keys`);
  return { data: { ...apiKey, key } };
};

export const POST = toApiRoute(createSafeAction(CreateApiKey, handler));
