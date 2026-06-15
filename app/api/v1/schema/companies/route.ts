import { NextResponse } from "next/server";

import { authenticateApiRequest } from "@/lib/api-auth";
import { getFieldDefinitions, toFieldDefinitionDTO } from "@/lib/custom-fields";
import { COMPANY_STANDARD_FIELDS } from "@/lib/api-v1-schema";

export const GET = async (req: Request) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const definitions = await getFieldDefinitions(auth.apiKey.orgId, "COMPANY");

  return NextResponse.json({
    data: {
      entityType: "COMPANY",
      fields: COMPANY_STANDARD_FIELDS,
      customFields: definitions.map(toFieldDefinitionDTO),
    },
  });
};
