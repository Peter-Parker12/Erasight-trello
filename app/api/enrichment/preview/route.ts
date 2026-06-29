import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { getEnrichmentProvider, isEnrichmentEnabled } from "@/lib/enrichment/providers";

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isEnrichmentEnabled()) {
    return NextResponse.json({ error: "Enrichment is disabled." }, { status: 403 });
  }

  const domain = new URL(req.url).searchParams.get("domain")?.trim();
  if (!domain) {
    return NextResponse.json({ error: "domain query param is required." }, { status: 400 });
  }

  const provider = getEnrichmentProvider();
  const result = await provider.enrich({ domain, companyId: "preview" });

  if (result.success) {
    return NextResponse.json({ data: result.data });
  }

  return NextResponse.json({ error: result.error }, { status: 422 });
}
