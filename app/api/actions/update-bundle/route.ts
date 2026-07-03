import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { ACTION, ENTITY_TYPE, Prisma } from "@prisma/client";

import { UpdateBundle } from "@/actions/update-bundle/schema";
import { InputType, ReturnType } from "@/actions/update-bundle/types";
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

  const { id, items, discount, finalPrice, ...fields } = data;

  let bundle;
  try {
    // Replace items: delete all existing then create new ones
    bundle = await db.$transaction(async (tx) => {
      await tx.productBundleItem.deleteMany({ where: { bundleId: id } });

      return tx.productBundle.update({
        where: { id, orgId },
        data: {
          ...fields,
          discount: discount != null ? new Prisma.Decimal(discount) : null,
          finalPrice: finalPrice != null ? new Prisma.Decimal(finalPrice) : null,
          items: {
            create: items.map((item) => ({
              ...(item.productId     ? { productId:     item.productId     } : {}),
              ...(item.childBundleId ? { childBundleId: item.childBundleId } : {}),
              quantity:  item.quantity,
              unitPrice: new Prisma.Decimal(item.unitPrice),
            })),
          },
        },
      });
    });

    await createAuditLog({
      entityId: bundle.id,
      entityTitle: bundle.name,
      entityType: ENTITY_TYPE.PRODUCT_BUNDLE,
      action: ACTION.UPDATE,
    });
  } catch {
    return { error: "Failed to update bundle." };
  }

  revalidatePath(`/organization/${orgId}/crm/products`);
  return { data: bundle };
};

export const POST = toApiRoute(createSafeAction(UpdateBundle, handler));
