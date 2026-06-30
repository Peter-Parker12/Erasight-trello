import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { ACTION, ENTITY_TYPE } from "@prisma/client";

import { CreateKbFolder } from "@/actions/create-kb-folder/schema";
import { InputType, ReturnType } from "@/actions/create-kb-folder/types";
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

  const industry = await db.kbIndustry.findUnique({ where: { id: data.industryId } });
  if (!industry || industry.orgId !== orgId) return { error: "Industry not found." };

  let folder;
  try {
    folder = await db.kbFolder.create({
      data: { orgId, industryId: data.industryId, name: data.name },
    });

    await createAuditLog({
      entityId: folder.id,
      entityTitle: folder.name,
      entityType: ENTITY_TYPE.KB_FOLDER,
      action: ACTION.CREATE,
    });
  } catch {
    return { error: "Failed to create folder." };
  }

  revalidatePath(`/organization/${orgId}/knowledge-base/${data.industryId}`);
  return { data: folder };
};

export const POST = toApiRoute(createSafeAction(CreateKbFolder, handler));
