import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { ACTION, ENTITY_TYPE } from "@prisma/client";

import { CreateKbIndustry } from "@/actions/create-kb-industry/schema";
import { InputType, ReturnType } from "@/actions/create-kb-industry/types";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { createAuditLog } from "@/lib/create-audit-log";
import { toApiRoute } from "@/lib/api-route";
import { canAccessModule } from "@/lib/module-access";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) return { error: "Unauthorized" };

  if (!(await canAccessModule(orgId, userId, "KNOWLEDGE_BASE"))) {
    return { error: "You don't have access to the Knowledge Base module." };
  }

  let industry;
  try {
    industry = await db.kbIndustry.create({
      data: { orgId, name: data.name, description: data.description },
    });

    await createAuditLog({
      entityId: industry.id,
      entityTitle: industry.name,
      entityType: ENTITY_TYPE.KB_INDUSTRY,
      action: ACTION.CREATE,
    });
  } catch {
    return { error: "Failed to create industry." };
  }

  revalidatePath(`/organization/${orgId}/knowledge-base`);
  return { data: industry };
};

export const POST = toApiRoute(createSafeAction(CreateKbIndustry, handler));
