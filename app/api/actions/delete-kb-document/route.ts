import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { ACTION, ENTITY_TYPE } from "@prisma/client";

import { DeleteKbDocument } from "@/actions/delete-kb-document/schema";
import { InputType, ReturnType } from "@/actions/delete-kb-document/types";
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

  let document;
  try {
    document = await db.kbDocument.findUnique({ where: { id: data.id } });
    if (!document || document.orgId !== orgId) return { error: "Not found." };

    document = await db.kbDocument.delete({ where: { id: data.id } });

    await createAuditLog({
      entityId: document.id,
      entityTitle: document.name,
      entityType: ENTITY_TYPE.KB_DOCUMENT,
      action: ACTION.DELETE,
    });
  } catch {
    return { error: "Failed to delete document." };
  }

  revalidatePath(`/organization/${orgId}/knowledge-base`);
  return { data: document };
};

export const POST = toApiRoute(createSafeAction(DeleteKbDocument, handler));
