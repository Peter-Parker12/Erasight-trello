import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { ACTION, ENTITY_TYPE } from "@prisma/client";

import { DeleteContact } from "@/actions/delete-contact/schema";
import { InputType, ReturnType } from "@/actions/delete-contact/types";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { createAuditLog } from "@/lib/create-audit-log";
import { toApiRoute } from "@/lib/api-route";
import { canAccessModule } from "@/lib/module-access";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return { error: "Unauthorized" };
  }

  if (!(await canAccessModule(orgId, userId, "CRM"))) {
    return { error: "You don't have access to the CRM module." };
  }

  const { id } = data;

  let contact;

  try {
    contact = await db.contact.delete({
      where: { id, orgId },
    });

    await createAuditLog({
      entityId: contact.id,
      entityTitle: `${contact.firstName} ${contact.lastName ?? ""}`.trim(),
      entityType: ENTITY_TYPE.CONTACT,
      action: ACTION.DELETE,
    });
  } catch {
    return { error: "Failed to delete contact." };
  }

  revalidatePath(`/organization/${orgId}/crm/contacts`);
  return { data: contact };
};

export const POST = toApiRoute(createSafeAction(DeleteContact, handler));
