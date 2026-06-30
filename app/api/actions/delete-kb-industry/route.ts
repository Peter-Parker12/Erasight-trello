import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { ACTION, ENTITY_TYPE } from "@prisma/client";

import { DeleteKbIndustry } from "@/actions/delete-kb-industry/schema";
import { InputType, ReturnType } from "@/actions/delete-kb-industry/types";
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
    industry = await db.kbIndustry.findUnique({ where: { id: data.id } });
    if (!industry || industry.orgId !== orgId) return { error: "Not found." };

    // Delete cascades: folders → documents handled via Prisma emulation
    const folders = await db.kbFolder.findMany({ where: { industryId: data.id } });
    const folderIds = folders.map((f) => f.id);
    await db.kbDocument.deleteMany({ where: { folderId: { in: folderIds } } });
    await db.kbFolder.deleteMany({ where: { industryId: data.id } });

    industry = await db.kbIndustry.delete({ where: { id: data.id } });

    await createAuditLog({
      entityId: industry.id,
      entityTitle: industry.name,
      entityType: ENTITY_TYPE.KB_INDUSTRY,
      action: ACTION.DELETE,
    });
  } catch {
    return { error: "Failed to delete industry." };
  }

  revalidatePath(`/organization/${orgId}/knowledge-base`);
  return { data: industry };
};

export const POST = toApiRoute(createSafeAction(DeleteKbIndustry, handler));
