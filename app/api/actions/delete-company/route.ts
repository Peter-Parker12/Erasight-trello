import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { ACTION, ENTITY_TYPE } from "@prisma/client";

import { DeleteCompany } from "@/actions/delete-company/schema";
import { InputType, ReturnType } from "@/actions/delete-company/types";
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

  let company;

  try {
    company = await db.company.delete({
      where: { id, orgId },
    });

    await createAuditLog({
      entityId: company.id,
      entityTitle: company.name,
      entityType: ENTITY_TYPE.COMPANY,
      action: ACTION.DELETE,
    });
  } catch {
    return { error: "Failed to delete company." };
  }

  revalidatePath(`/organization/${orgId}/crm/companies`);
  return { data: company };
};

export const POST = toApiRoute(createSafeAction(DeleteCompany, handler));
