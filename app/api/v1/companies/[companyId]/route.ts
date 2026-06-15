import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/api-auth";
import { companyBaseFields } from "@/lib/crm-schemas";
import { getFieldDefinitions, validateCustomFields } from "@/lib/custom-fields";
import { z } from "zod";

const UpdateCompanyBody = z.object(companyBaseFields).partial();

type Params = { params: Promise<{ companyId: string }> };

export const GET = async (req: Request, { params }: Params) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { companyId } = await params;
  const company = await db.company.findUnique({ where: { id: companyId, orgId: auth.apiKey.orgId } });
  if (!company) return NextResponse.json({ error: "Company not found." }, { status: 404 });

  return NextResponse.json({ data: company });
};

export const PATCH = async (req: Request, { params }: Params) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { companyId } = await params;
  const existing = await db.company.findUnique({ where: { id: companyId, orgId: auth.apiKey.orgId } });
  if (!existing) return NextResponse.json({ error: "Company not found." }, { status: 404 });

  const body = await req.json().catch(() => null);
  if (body === null) return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });

  const parsed = UpdateCompanyBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed.", details: parsed.error.flatten() }, { status: 422 });
  }

  const { customFields, ...fields } = parsed.data;

  let customFieldsData: Prisma.InputJsonObject | undefined;
  if (customFields !== undefined) {
    const definitions = await getFieldDefinitions(auth.apiKey.orgId, "COMPANY");
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

  const company = await db.company.update({
    where: { id: companyId, orgId: auth.apiKey.orgId },
    data: { ...fields, ...(customFieldsData ? { customFields: customFieldsData } : {}) },
  });

  return NextResponse.json({ data: company });
};

export const DELETE = async (req: Request, { params }: Params) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { companyId } = await params;
  const existing = await db.company.findUnique({ where: { id: companyId, orgId: auth.apiKey.orgId } });
  if (!existing) return NextResponse.json({ error: "Company not found." }, { status: 404 });

  await db.company.delete({ where: { id: companyId, orgId: auth.apiKey.orgId } });

  return NextResponse.json({ data: { id: companyId } });
};
