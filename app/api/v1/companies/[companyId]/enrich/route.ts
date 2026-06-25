import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { db } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/api-auth";
import { getEnrichmentProvider } from "@/lib/enrichment/providers";
import {
  computeEnrichmentPatch,
  resolveOverrideMode,
} from "@/lib/enrichment/apply";

const EnrichBody = z.object({
  overrideMode: z.enum(["EMPTY_ONLY", "OVERWRITE_ALL"]).default("EMPTY_ONLY"),
});

type Params = { params: Promise<{ companyId: string }> };

export const POST = async (req: Request, { params }: Params) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { companyId } = await params;
  const orgId = auth.apiKey.orgId;

  const company = await db.company.findUnique({ where: { id: companyId, orgId } });
  if (!company) return NextResponse.json({ error: "Company not found." }, { status: 404 });

  if (!company.domain) {
    return NextResponse.json({ error: "Company needs a domain before it can be enriched." }, { status: 422 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = EnrichBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed.", details: parsed.error.flatten() }, { status: 422 });
  }

  const effectiveMode = resolveOverrideMode(company, parsed.data.overrideMode);
  const provider = getEnrichmentProvider();

  try {
    const result = await provider.enrich({ domain: company.domain, companyId: company.id });

    if (result.success) {
      const patch = computeEnrichmentPatch(company, result.data, effectiveMode);
      const updated = await db.company.update({
        where: { id: companyId, orgId },
        data: {
          ...patch,
          enrichmentStatus: "SUCCESS",
          enrichmentSource: provider.key,
          enrichmentLastRunAt: new Date(),
          enrichmentRaw: result.raw as Prisma.InputJsonValue,
        },
      });
      return NextResponse.json({ data: updated });
    }

    const failed = await db.company.update({
      where: { id: companyId, orgId },
      data: {
        enrichmentStatus: result.status,
        enrichmentSource: provider.key,
        enrichmentLastRunAt: new Date(),
        enrichmentRaw: {
          error: result.error,
          status: result.status,
          at: new Date().toISOString(),
        } as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json(
      {
        error:
          result.status === "NOT_FOUND"
            ? "Provider could not find this company."
            : result.error,
        data: failed,
      },
      { status: 422 },
    );
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Enrichment failed unexpectedly.",
      },
      { status: 500 },
    );
  }
};
