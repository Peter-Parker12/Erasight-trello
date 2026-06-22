import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { ACTION, ENTITY_TYPE } from "@prisma/client";

import { DeleteProduct } from "@/actions/delete-product/schema";
import { InputType, ReturnType } from "@/actions/delete-product/types";
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

  let product;
  try {
    product = await db.product.delete({ where: { id: data.id, orgId } });

    await createAuditLog({
      entityId: product.id,
      entityTitle: product.name,
      entityType: ENTITY_TYPE.PRODUCT,
      action: ACTION.DELETE,
    });
  } catch {
    return { error: "Failed to delete product." };
  }

  revalidatePath(`/organization/${orgId}/crm/products`);
  return { data: product };
};

export const POST = toApiRoute(createSafeAction(DeleteProduct, handler));
