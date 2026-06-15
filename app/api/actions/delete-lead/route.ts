import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { ACTION, ENTITY_TYPE } from "@prisma/client";

import { DeleteLead } from "@/actions/delete-lead/schema";
import { InputType, ReturnType } from "@/actions/delete-lead/types";
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

  let lead;

  try {
    lead = await db.lead.delete({
      where: { id, orgId },
    });

    await createAuditLog({
      entityId: lead.id,
      entityTitle: lead.title,
      entityType: ENTITY_TYPE.LEAD,
      action: ACTION.DELETE,
    });
  } catch {
    return { error: "Failed to delete lead." };
  }

  revalidatePath(`/organization/${orgId}/crm/leads`);
  return { data: lead };
};

export const POST = toApiRoute(createSafeAction(DeleteLead, handler));
