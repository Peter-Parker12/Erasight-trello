import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { db } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/api-auth";
import { companyBaseFields } from "@/lib/crm-schemas";
import { getFieldDefinitions, validateCustomFields } from "@/lib/custom-fields";

const CreateCompanyBody = z.object(companyBaseFields);

export const GET = async (req: Request) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 50, 1), 100);
  const offset = Math.max(Number(searchParams.get("offset")) || 0, 0);

  const where = { orgId: auth.apiKey.orgId };

  const [data, total] = await Promise.all([
    db.company.findMany({ where, orderBy: { createdAt: "desc" }, take: limit, skip: offset }),
    db.company.count({ where }),
  ]);

  return NextResponse.json({ data, meta: { limit, offset, total } });
};

export const POST = async (req: Request) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => null);
  if (body === null) return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });

  const parsed = CreateCompanyBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed.", details: parsed.error.flatten() }, { status: 422 });
  }

  const { customFields, ...fields } = parsed.data;

  const definitions = await getFieldDefinitions(auth.apiKey.orgId, "COMPANY");
  const validation = validateCustomFields(definitions, customFields);
  if (!validation.success) {
    return NextResponse.json(
      { error: "Invalid custom field values.", details: validation.error.flatten() },
      { status: 422 },
    );
  }

  const company = await db.company.create({
    data: {
      orgId: auth.apiKey.orgId,
      ...fields,
      customFields: validation.data as Prisma.InputJsonObject,
    },
  });

  return NextResponse.json({ data: company }, { status: 201 });
};
