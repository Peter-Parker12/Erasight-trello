import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

import { CreatePipelineStage } from "@/actions/create-pipeline-stage/schema";
import { InputType, ReturnType } from "@/actions/create-pipeline-stage/types";
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

  let stage;

  try {
    const lastStage = await db.pipelineStage.findFirst({
      where: { orgId },
      orderBy: { order: "desc" },
    });

    stage = await db.pipelineStage.create({
      data: {
        orgId,
        ...data,
        order: (lastStage?.order ?? -1) + 1,
      },
    });
  } catch {
    return { error: "Failed to create stage." };
  }

  revalidatePath(`/organization/${orgId}/crm/leads`);
  return { data: stage };
};

export const POST = toApiRoute(createSafeAction(CreatePipelineStage, handler));
