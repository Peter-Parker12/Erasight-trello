import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

import { DeletePipelineStage } from "@/actions/delete-pipeline-stage/schema";
import { InputType, ReturnType } from "@/actions/delete-pipeline-stage/types";
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

  const { id } = data;

  let stage;

  try {
    const otherStage = await db.pipelineStage.findFirst({
      where: { orgId, id: { not: id } },
      orderBy: { order: "asc" },
    });

    if (!otherStage) {
      return { error: "You can't delete the only pipeline stage." };
    }

    // Move any leads out of this stage before deleting it, since deleting a
    // stage cascade-deletes its leads.
    await db.lead.updateMany({
      where: { orgId, stageId: id },
      data: { stageId: otherStage.id },
    });

    stage = await db.pipelineStage.delete({
      where: { id, orgId },
    });
  } catch {
    return { error: "Failed to delete stage." };
  }

  revalidatePath(`/organization/${orgId}/crm/leads`);
  return { data: stage };
};

export const POST = toApiRoute(createSafeAction(DeletePipelineStage, handler));
