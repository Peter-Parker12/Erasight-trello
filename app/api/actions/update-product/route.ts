import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { ACTION, ENTITY_TYPE, Prisma } from "@prisma/client";

import { UpdateProduct } from "@/actions/update-product/schema";
import { InputType, ReturnType } from "@/actions/update-product/types";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { createAuditLog } from "@/lib/create-audit-log";
import { toApiRoute } from "@/lib/api-route";
import { canAccessModule } from "@/lib/module-access";
import { getFieldDefinitions, validateCustomFields } from "@/lib/custom-fields";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return { error: "Unauthorized" };

  if (!(await canAccessModule(orgId, userId, "CRM"))) {
    return { error: "You don't have access to the CRM module." };
  }

  const { id, customFields, unitPrice, categories, name, ...fields } = data;

  const definitions = await getFieldDefinitions(orgId, "PRODUCT");
  const validation = validateCustomFields(definitions, customFields);
  if (!validation.success) return { error: "Invalid custom field values." };

  let product;
  try {
    [product] = await db.$transaction([
      db.product.update({
        where: { id, orgId },
        data: {
          ...fields,
          ...(name !== undefined && { name: name ?? "" }),
          categories: categories ?? [],
          ...(unitPrice !== undefined && { unitPrice: new Prisma.Decimal(unitPrice ?? 0) }),
          customFields: validation.data as Prisma.InputJsonObject,
        },
      }),
      db.productBundleItem.updateMany({
        where: { productId: id },
        data: { active: fields.status === "ACTIVE" },
      }),
    ]);

    await createAuditLog({
      entityId: product.id,
      entityTitle: product.name,
      entityType: ENTITY_TYPE.PRODUCT,
      action: ACTION.UPDATE,
    });
  } catch {
    return { error: "Failed to update product." };
  }

  revalidatePath(`/organization/${orgId}/crm/products`);
  return { data: product };
};

export const POST = toApiRoute(createSafeAction(UpdateProduct, handler));
