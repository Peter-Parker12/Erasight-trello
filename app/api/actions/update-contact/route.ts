import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { ACTION, ENTITY_TYPE, Prisma } from "@prisma/client";

import { UpdateContact } from "@/actions/update-contact/schema";
import { InputType, ReturnType } from "@/actions/update-contact/types";
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
    const definitions = await getFieldDefinitions(orgId, "CONTACT");
    const validation = validateCustomFields(definitions, customFields);
    if (!validation.success) {
      return { error: "Invalid custom field values." };
    }
    customFieldsData = validation.data as Prisma.InputJsonObject;
  }

  if (fields.companyId) {
    const company = await db.company.findUnique({
      where: { id: fields.companyId, orgId },
    });
    if (!company) {
      return { error: "Company not found." };
    }
  }

  let contact;

  try {
    contact = await db.contact.update({
      where: { id, orgId },
      data: {
        ...fields,
        ...(customFieldsData !== undefined ? { customFields: customFieldsData } : {}),
      },
    });

    await createAuditLog({
      entityId: contact.id,
      entityTitle: `${contact.firstName} ${contact.lastName ?? ""}`.trim(),
      entityType: ENTITY_TYPE.CONTACT,
      action: ACTION.UPDATE,
    });
  } catch {
    return { error: "Failed to update contact." };
  }

  revalidatePath(`/organization/${orgId}/crm/contacts`);
  revalidatePath(`/organization/${orgId}/crm/contacts/${id}`);
  return { data: contact };
};

export const POST = toApiRoute(createSafeAction(UpdateContact, handler));
