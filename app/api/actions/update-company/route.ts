import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { ACTION, ENTITY_TYPE, Prisma } from "@prisma/client";

import { UpdateCompany } from "@/actions/update-company/schema";
import { InputType, ReturnType } from "@/actions/update-company/types";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { createAuditLog } from "@/lib/create-audit-log";
import { toApiRoute } from "@/lib/api-route";
import { canAccessModule } from "@/lib/module-access";
import { getFieldDefinitions, validateCustomFields } from "@/lib/custom-fields";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return { error: "Unauthorized" };
  }

  if (!(await canAccessModule(orgId, userId, "CRM"))) {
    return { error: "You don't have access to the CRM module." };
  }

  const { id, customFields, ...fields } = data;

  let customFieldsData: Prisma.InputJsonObject | undefined;

  if (customFields !== undefined) {
    const definitions = await getFieldDefinitions(orgId, "COMPANY");
    const validation = validateCustomFields(definitions, customFields);
    if (!validation.success) {
      return { error: "Invalid custom field values." };
    }
    customFieldsData = validation.data as Prisma.InputJsonObject;
  }

  let company;

  try {
    company = await db.company.update({
      where: { id, orgId },
      data: {
        ...fields,
        ...(customFieldsData !== undefined ? { customFields: customFieldsData } : {}),
      },
    });

    await createAuditLog({
      entityId: company.id,
      entityTitle: company.name,
      entityType: ENTITY_TYPE.COMPANY,
      action: ACTION.UPDATE,
    });
  } catch {
    return { error: "Failed to update company." };
  }

  revalidatePath(`/organization/${orgId}/crm/companies`);
  revalidatePath(`/organization/${orgId}/crm/companies/${id}`);
  return { data: company };
};

export const POST = toApiRoute(createSafeAction(UpdateCompany, handler));
