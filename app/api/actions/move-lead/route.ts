import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

import { MoveLead } from "@/actions/move-lead/schema";
import { InputType, ReturnType } from "@/actions/move-lead/types";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
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

  const { items } = data;

  let leads;

  try {
    const transaction = items.map((item) =>
      db.lead.update({
        where: { id: item.id, orgId },
        data: { order: item.order, stageId: item.stageId },
      })
    );

    leads = await db.$transaction(transaction);
  } catch {
    return { error: "Failed to move lead." };
  }

  revalidatePath(`/organization/${orgId}/crm/leads`);
  return { data: leads };
};

export const POST = toApiRoute(createSafeAction(MoveLead, handler));
