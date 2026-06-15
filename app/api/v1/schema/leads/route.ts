import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/api-auth";
import { getFieldDefinitions, toFieldDefinitionDTO } from "@/lib/custom-fields";
import { LEAD_STANDARD_FIELDS } from "@/lib/api-v1-schema";
import { ensureDefaultPipelineStages } from "@/lib/pipeline-stages";

export const GET = async (req: Request) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const orgId = auth.apiKey.orgId;

  await ensureDefaultPipelineStages(orgId);

  const [definitions, stages] = await Promise.all([
    getFieldDefinitions(orgId, "LEAD"),
    db.pipelineStage.findMany({ where: { orgId }, orderBy: { order: "asc" } }),
  ]);

  return NextResponse.json({
    data: {
      entityType: "LEAD",
      fields: LEAD_STANDARD_FIELDS,
      customFields: definitions.map(toFieldDefinitionDTO),
      pipelineStages: stages.map((stage) => ({
        id: stage.id,
        name: stage.name,
        order: stage.order,
        isWon: stage.isWon,
        isLost: stage.isLost,
      })),
    },
  });
};
