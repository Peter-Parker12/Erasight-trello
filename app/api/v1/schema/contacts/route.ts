import { NextResponse } from "next/server";

import { authenticateApiRequest } from "@/lib/api-auth";
import { getFieldDefinitions, toFieldDefinitionDTO } from "@/lib/custom-fields";
import { CONTACT_STANDARD_FIELDS } from "@/lib/api-v1-schema";

export const GET = async (req: Request) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const definitions = await getFieldDefinitions(auth.apiKey.orgId, "CONTACT");

  return NextResponse.json({
    data: {
      entityType: "CONTACT",
      fields: CONTACT_STANDARD_FIELDS,
      customFields: definitions.map(toFieldDefinitionDTO),
    },
  });
};
