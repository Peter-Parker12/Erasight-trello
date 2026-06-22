import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { ACTION, ENTITY_TYPE, Prisma } from "@prisma/client";

import { CreateBundle } from "@/actions/create-bundle/schema";
import { InputType, ReturnType } from "@/actions/create-bundle/types";
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

  const { items, discount, finalPrice, ...fields } = data;

  let bundle;
  try {
    bundle = await db.productBundle.create({
      data: {
        orgId,
        ...fields,
        discount: discount != null ? new Prisma.Decimal(discount) : null,
        finalPrice: finalPrice != null ? new Prisma.Decimal(finalPrice) : null,
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: new Prisma.Decimal(item.unitPrice),
          })),
        },
      },
    });

    await createAuditLog({
      entityId: bundle.id,
      entityTitle: bundle.name,
      entityType: ENTITY_TYPE.PRODUCT_BUNDLE,
      action: ACTION.CREATE,
    });
  } catch {
    return { error: "Failed to create bundle." };
  }

  revalidatePath(`/organization/${orgId}/crm/products`);
  return { data: bundle };
};

export const POST = toApiRoute(createSafeAction(CreateBundle, handler));
