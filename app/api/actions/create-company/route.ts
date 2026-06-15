import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { ACTION, ENTITY_TYPE, Prisma } from "@prisma/client";

import { CreateCompany } from "@/actions/create-company/schema";
import { InputType, ReturnType } from "@/actions/create-company/types";
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

  const { customFields, ...fields } = data;

  const definitions = await getFieldDefinitions(orgId, "COMPANY");
  const validation = validateCustomFields(definitions, customFields);
  if (!validation.success) {
    return { error: "Invalid custom field values." };
  }

  let company;

  try {
    company = await db.company.create({
      data: {
        orgId,
        ...fields,
        customFields: validation.data as Prisma.InputJsonObject,
      },
    });

    await createAuditLog({
      entityId: company.id,
      entityTitle: company.name,
      entityType: ENTITY_TYPE.COMPANY,
      action: ACTION.CREATE,
    });
  } catch {
    return { error: "Failed to create company." };
  }

  revalidatePath(`/organization/${orgId}/crm/companies`);
  return { data: company };
};

export const POST = toApiRoute(createSafeAction(CreateCompany, handler));
