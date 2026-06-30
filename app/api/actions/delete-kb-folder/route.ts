import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { ACTION, ENTITY_TYPE } from "@prisma/client";

import { DeleteKbFolder } from "@/actions/delete-kb-folder/schema";
import { InputType, ReturnType } from "@/actions/delete-kb-folder/types";
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

  let folder;
  try {
    folder = await db.kbFolder.findUnique({ where: { id: data.id } });
    if (!folder || folder.orgId !== orgId) return { error: "Not found." };

    await db.kbDocument.deleteMany({ where: { folderId: data.id } });
    folder = await db.kbFolder.delete({ where: { id: data.id } });

    await createAuditLog({
      entityId: folder.id,
      entityTitle: folder.name,
      entityType: ENTITY_TYPE.KB_FOLDER,
      action: ACTION.DELETE,
    });
  } catch {
    return { error: "Failed to delete folder." };
  }

  revalidatePath(`/organization/${orgId}/knowledge-base`);
  return { data: folder };
};

export const POST = toApiRoute(createSafeAction(DeleteKbFolder, handler));
