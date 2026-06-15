import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import type { Prisma } from "@prisma/client";

import { UpdateCustomField } from "@/actions/update-custom-field/schema";
import { InputType, ReturnType } from "@/actions/update-custom-field/types";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { toApiRoute } from "@/lib/api-route";
import { isOrgAdmin } from "@/lib/board-access";
import { ENTITY_TYPE_PATHS } from "@/lib/crm-entity-paths";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { orgId } = await auth();
  if (!orgId) return { error: "Unauthorized" };

  if (!(await isOrgAdmin(orgId))) {
    return { error: "Only admins can manage custom fields." };
  }

  const { id, options, ...fields } = data;

  let definition;

  try {
    definition = await db.customFieldDefinition.update({
      where: { id, orgId },
      data: {
        ...fields,
        ...(options !== undefined ? { options: { options } as Prisma.InputJsonObject } : {}),
      },
    });
  } catch {
    return { error: "Failed to update custom field." };
  }

  revalidatePath(`/organization/${orgId}/settings/app/custom-fields`);
  revalidatePath(`/organization/${orgId}/crm/${ENTITY_TYPE_PATHS[definition.entityType]}`);
  return { data: definition };
};

export const POST = toApiRoute(createSafeAction(UpdateCustomField, handler));
