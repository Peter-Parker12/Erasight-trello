import { NextResponse } from "next/server";

import { authenticateApiRequest } from "@/lib/api-auth";
import { buildOpenApiSpec } from "@/lib/openapi-spec";

export const GET = async (req: Request) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const url = new URL(req.url);
  const baseUrl = `${url.protocol}//${url.host}`;

  const spec = await buildOpenApiSpec(auth.apiKey.orgId, baseUrl);

  return NextResponse.json(spec, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
};
