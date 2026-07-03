import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { ACTION, ENTITY_TYPE, Prisma } from "@prisma/client";

import { CreateProduct } from "@/actions/create-product/schema";
import { InputType, ReturnType } from "@/actions/create-product/types";
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

  const { customFields, unitPrice, categories, name, ...fields } = data;

  const definitions = await getFieldDefinitions(orgId, "PRODUCT");
  const validation = validateCustomFields(definitions, customFields);
  if (!validation.success) return { error: "Invalid custom field values." };

  let product;
  try {
    product = await db.product.create({
      data: {
        orgId,
        ...fields,
        name: name ?? "",
        categories: categories ?? [],
        unitPrice: new Prisma.Decimal(unitPrice ?? 0),
        customFields: validation.data as Prisma.InputJsonObject,
      },
    });

    await createAuditLog({
      entityId: product.id,
      entityTitle: product.name,
      entityType: ENTITY_TYPE.PRODUCT,
      action: ACTION.CREATE,
    });
  } catch {
    return { error: "Failed to create product." };
  }

  revalidatePath(`/organization/${orgId}/crm/products`);
  return { data: product };
};

export const POST = toApiRoute(createSafeAction(CreateProduct, handler));
