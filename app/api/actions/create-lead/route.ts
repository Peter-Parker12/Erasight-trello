import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { ACTION, ENTITY_TYPE, Prisma } from "@prisma/client";

import { CreateLead } from "@/actions/create-lead/schema";
import { InputType, ReturnType } from "@/actions/create-lead/types";
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

  const definitions = await getFieldDefinitions(orgId, "LEAD");
  const validation = validateCustomFields(definitions, customFields);
  if (!validation.success) {
    return { error: "Invalid custom field values." };
  }

  const stage = await db.pipelineStage.findUnique({
    where: { id: fields.stageId, orgId },
  });
  if (!stage) {
    return { error: "Pipeline stage not found." };
  }

  if (fields.companyId) {
    const company = await db.company.findUnique({ where: { id: fields.companyId, orgId } });
    if (!company) return { error: "Company not found." };
  }

  if (fields.contactId) {
    const contact = await db.contact.findUnique({ where: { id: fields.contactId, orgId } });
    if (!contact) return { error: "Contact not found." };
  }

  let lead;

  try {
    const lastLead = await db.lead.findFirst({
      where: { orgId, stageId: fields.stageId },
      orderBy: { order: "desc" },
    });

    lead = await db.lead.create({
      data: {
        orgId,
        ...fields,
        order: (lastLead?.order ?? -1) + 1,
        customFields: validation.data as Prisma.InputJsonObject,
      },
    });

    await createAuditLog({
      entityId: lead.id,
      entityTitle: lead.title,
      entityType: ENTITY_TYPE.LEAD,
      action: ACTION.CREATE,
    });
  } catch {
    return { error: "Failed to create lead." };
  }

  revalidatePath(`/organization/${orgId}/crm/leads`);
  return { data: lead };
};

export const POST = toApiRoute(createSafeAction(CreateLead, handler));
