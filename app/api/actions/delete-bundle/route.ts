import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { ACTION, ENTITY_TYPE } from "@prisma/client";

import { DeleteBundle } from "@/actions/delete-bundle/schema";
import { InputType, ReturnType } from "@/actions/delete-bundle/types";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { createAuditLog } from "@/lib/create-audit-log";
import { toApiRoute } from "@/lib/api-route";
import { canAccessModule } from "@/lib/module-access";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return { error: "Unauthorized" };

  if (!(await canAccessModule(orgId, userId, "CRM"))) {
    return { error: "You don't have access to the CRM module." };
  }

  let bundle;
  try {
    bundle = await db.productBundle.delete({ where: { id: data.id, orgId } });

    await createAuditLog({
      entityId: bundle.id,
      entityTitle: bundle.name,
      entityType: ENTITY_TYPE.PRODUCT_BUNDLE,
      action: ACTION.DELETE,
    });
  } catch {
    return { error: "Failed to delete bundle." };
  }

  revalidatePath(`/organization/${orgId}/crm/products`);
  return { data: bundle };
};

export const POST = toApiRoute(createSafeAction(DeleteBundle, handler));
