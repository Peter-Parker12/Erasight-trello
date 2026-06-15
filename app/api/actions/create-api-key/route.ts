import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

import { CreateApiKey } from "@/actions/create-api-key/schema";
import { InputType, ReturnType } from "@/actions/create-api-key/types";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { toApiRoute } from "@/lib/api-route";
import { isOrgAdmin } from "@/lib/board-access";
import { generateApiKey } from "@/lib/api-keys";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return { error: "Unauthorized" };

  if (!(await isOrgAdmin(orgId))) {
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
