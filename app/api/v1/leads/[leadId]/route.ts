import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { db } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/api-auth";
import { leadBaseFields } from "@/lib/crm-schemas";
import { getFieldDefinitions, validateCustomFields } from "@/lib/custom-fields";

const UpdateLeadBody = z.object(leadBaseFields).partial();

type Params = { params: Promise<{ leadId: string }> };

export const GET = async (req: Request, { params }: Params) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { leadId } = await params;
  const lead = await db.lead.findUnique({ where: { id: leadId, orgId: auth.apiKey.orgId } });
  if (!lead) return NextResponse.json({ error: "Lead not found." }, { status: 404 });

  return NextResponse.json({ data: lead });
};

export const PATCH = async (req: Request, { params }: Params) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { leadId } = await params;
  const orgId = auth.apiKey.orgId;

  const existing = await db.lead.findUnique({ where: { id: leadId, orgId } });
  if (!existing) return NextResponse.json({ error: "Lead not found." }, { status: 404 });

  const body = await req.json().catch(() => null);
  if (body === null) return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });

  const parsed = UpdateLeadBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed.", details: parsed.error.flatten() }, { status: 422 });
  }

  const { customFields, stageId, ...fields } = parsed.data;

  let orderUpdate: { order: number } | undefined;
  if (stageId && stageId !== existing.stageId) {
    const stage = await db.pipelineStage.findUnique({ where: { id: stageId, orgId } });
    if (!stage) return NextResponse.json({ error: "Pipeline stage not found." }, { status: 422 });

    const lastLead = await db.lead.findFirst({ where: { orgId, stageId }, orderBy: { order: "desc" } });
    orderUpdate = { order: (lastLead?.order ?? -1) + 1 };
  }

  if (fields.companyId) {
    const company = await db.company.findUnique({ where: { id: fields.companyId, orgId } });
    if (!company) return NextResponse.json({ error: "Company not found." }, { status: 422 });
  }

  if (fields.contactId) {
    const contact = await db.contact.findUnique({ where: { id: fields.contactId, orgId } });
    if (!contact) return NextResponse.json({ error: "Contact not found." }, { status: 422 });
  }

  let customFieldsData: Prisma.InputJsonObject | undefined;
  if (customFields !== undefined) {
    const definitions = await getFieldDefinitions(orgId, "LEAD");
    const merged = { ...(existing.customFields as Record<string, unknown>), ...customFields };
    const validation = validateCustomFields(definitions, merged);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid custom field values.", details: validation.error.flatten() },
        { status: 422 },
      );
    }
    customFieldsData = validation.data as Prisma.InputJsonObject;
  }

  const lead = await db.lead.update({
    where: { id: leadId, orgId },
    data: {
      ...fields,
      ...(stageId ? { stageId } : {}),
      ...(orderUpdate ?? {}),
      ...(customFieldsData ? { customFields: customFieldsData } : {}),
    },
  });

  return NextResponse.json({ data: lead });
};

export const DELETE = async (req: Request, { params }: Params) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { leadId } = await params;
  const existing = await db.lead.findUnique({ where: { id: leadId, orgId: auth.apiKey.orgId } });
  if (!existing) return NextResponse.json({ error: "Lead not found." }, { status: 404 });

  await db.lead.delete({ where: { id: leadId, orgId: auth.apiKey.orgId } });

  return NextResponse.json({ data: { id: leadId } });
};
