import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { ACTION, ENTITY_TYPE } from "@prisma/client";

import { CreateKbDocument } from "@/actions/create-kb-document/schema";
import { InputType, ReturnType } from "@/actions/create-kb-document/types";
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

  const folder = await db.kbFolder.findUnique({ where: { id: data.folderId } });
  if (!folder || folder.orgId !== orgId) return { error: "Folder not found." };

  let document;
  try {
    document = await db.kbDocument.create({
      data: {
        orgId,
        folderId: data.folderId,
        name: data.name,
        description: data.description,
        url: data.url,
        fileType: data.fileType,
        fileSize: data.fileSize,
        uploadedBy: userId,
      },
    });

    await createAuditLog({
      entityId: document.id,
      entityTitle: document.name,
      entityType: ENTITY_TYPE.KB_DOCUMENT,
      action: ACTION.CREATE,
    });
  } catch {
    return { error: "Failed to create document." };
  }

  revalidatePath(`/organization/${orgId}/knowledge-base/${folder.industryId}`);
  return { data: document };
};

export const POST = toApiRoute(createSafeAction(CreateKbDocument, handler));
