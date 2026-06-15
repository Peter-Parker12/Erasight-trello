import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

import { DeleteApiKey } from "@/actions/delete-api-key/schema";
import { InputType, ReturnType } from "@/actions/delete-api-key/types";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { toApiRoute } from "@/lib/api-route";
import { isOrgAdmin } from "@/lib/board-access";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { orgId } = await auth();
  if (!orgId) return { error: "Unauthorized" };

  if (!(await isOrgAdmin(orgId))) {
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
