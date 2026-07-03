import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import type { Prisma } from "@prisma/client";

import { CreateCustomField } from "@/actions/create-custom-field/schema";
import { InputType, ReturnType } from "@/actions/create-custom-field/types";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { toApiRoute } from "@/lib/api-route";
import { canAccessModule } from "@/lib/module-access";
import { ENTITY_TYPE_PATHS } from "@/lib/crm-entity-paths";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { orgId, userId } = await auth();
  if (!orgId || !userId) return { error: "Unauthorized" };

  if (!(await canAccessModule(orgId, userId, "CRM"))) {
    return { error: "You don't have access to the CRM module." };
  }

  const { entityType, key, label, fieldType, options, required } = data;

  const existing = await db.customFieldDefinition.findUnique({
    where: { orgId_entityType_key: { orgId, entityType, key } },
  });
  if (existing) {
    return { error: "A custom field with this key already exists for this object." };
  }

  let definition;

  try {
    const last = await db.customFieldDefinition.findFirst({
      where: { orgId, entityType },
      orderBy: { order: "desc" },
    });

    definition = await db.customFieldDefinition.create({
      data: {
        orgId,
        entityType,
        key,
        label,
        fieldType,
        required: required ?? false,
        order: (last?.order ?? -1) + 1,
        options: options ? ({ options } as Prisma.InputJsonObject) : undefined,
      },
    });
  } catch {
    return { error: "Failed to create custom field." };
  }

  revalidatePath(`/organization/${orgId}/settings/app/custom-fields`);
  revalidatePath(`/organization/${orgId}/crm/${ENTITY_TYPE_PATHS[entityType]}`);
  return { data: definition };
};

export const POST = toApiRoute(createSafeAction(CreateCustomField, handler));
