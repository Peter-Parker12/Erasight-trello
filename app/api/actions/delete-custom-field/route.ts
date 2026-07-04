import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

import { DeleteCustomField } from "@/actions/delete-custom-field/schema";
import { InputType, ReturnType } from "@/actions/delete-custom-field/types";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { toApiRoute } from "@/lib/api-route";
import { ENTITY_TYPE_PATHS } from "@/lib/crm-entity-paths";
import { canPerform } from "@/lib/rbac";
import { ACTIONS } from "@/lib/rbac-actions";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();
  if (!orgId || !userId) return { error: "Unauthorized" };

  if (!(await canPerform(orgId, userId, ACTIONS.CRM_CUSTOM_FIELDS_MANAGE))) {
    return { error: "Only admins can manage custom fields." };
  }

  const { id } = data;

  let definition;

  try {
    definition = await db.customFieldDefinition.delete({
      where: { id, orgId },
    });
  } catch {
    return { error: "Failed to delete custom field." };
  }

  revalidatePath(`/organization/${orgId}/settings/app/custom-fields`);
  revalidatePath(`/organization/${orgId}/crm/${ENTITY_TYPE_PATHS[definition.entityType]}`);
  return { data: definition };
};

export const POST = toApiRoute(createSafeAction(DeleteCustomField, handler));
