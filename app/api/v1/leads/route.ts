import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { db } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/api-auth";
import { leadBaseFields } from "@/lib/crm-schemas";
import { ensureDefaultPipelineStages } from "@/lib/pipeline-stages";
import { getFieldDefinitions, validateCustomFields } from "@/lib/custom-fields";

// stageId is optional for the public API: if omitted, the lead is placed in
// the org's first pipeline stage (by order).
const CreateLeadBody = z.object({ ...leadBaseFields, stageId: z.string().optional().nullable() });

export const GET = async (req: Request) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 50, 1), 100);
  const offset = Math.max(Number(searchParams.get("offset")) || 0, 0);
  const q = searchParams.get("q")?.trim() || undefined;

  const where = {
    orgId: auth.apiKey.orgId,
    ...(q ? { title: { contains: q, mode: "insensitive" as const } } : {}),
  };

  const [data, total] = await Promise.all([
    db.lead.findMany({ where, orderBy: { createdAt: "desc" }, take: limit, skip: offset }),
    db.lead.count({ where }),
  ]);

  return NextResponse.json({ data, meta: { limit, offset, total } });
};

export const POST = async (req: Request) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => null);
  if (body === null) return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });

  const parsed = CreateLeadBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed.", details: parsed.error.flatten() }, { status: 422 });
  }

  const { customFields, stageId, ...fields } = parsed.data;
  const orgId = auth.apiKey.orgId;

  let resolvedStageId = stageId ?? undefined;
  if (resolvedStageId) {
    const stage = await db.pipelineStage.findUnique({ where: { id: resolvedStageId, orgId } });
    if (!stage) return NextResponse.json({ error: "Pipeline stage not found." }, { status: 422 });
  } else {
    await ensureDefaultPipelineStages(orgId);
    const firstStage = await db.pipelineStage.findFirst({ where: { orgId }, orderBy: { order: "asc" } });
    resolvedStageId = firstStage!.id;
  }

  if (fields.companyId) {
    const company = await db.company.findUnique({ where: { id: fields.companyId, orgId } });
    if (!company) return NextResponse.json({ error: "Company not found." }, { status: 422 });
  }

  if (fields.contactId) {
    const contact = await db.contact.findUnique({ where: { id: fields.contactId, orgId } });
    if (!contact) return NextResponse.json({ error: "Contact not found." }, { status: 422 });
  }

  const definitions = await getFieldDefinitions(orgId, "LEAD");
  const validation = validateCustomFields(definitions, customFields);
  if (!validation.success) {
    return NextResponse.json(
      { error: "Invalid custom field values.", details: validation.error.flatten() },
      { status: 422 },
    );
  }

  const lastLead = await db.lead.findFirst({
    where: { orgId, stageId: resolvedStageId },
    orderBy: { order: "desc" },
  });

  const lead = await db.lead.create({
    data: {
      orgId,
      ...fields,
      stageId: resolvedStageId,
      order: (lastLead?.order ?? -1) + 1,
      customFields: validation.data as Prisma.InputJsonObject,
    },
  });

  return NextResponse.json({ data: lead }, { status: 201 });
};
