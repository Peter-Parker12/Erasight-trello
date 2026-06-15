import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

import { DeleteCustomField } from "@/actions/delete-custom-field/schema";
import { InputType, ReturnType } from "@/actions/delete-custom-field/types";
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
