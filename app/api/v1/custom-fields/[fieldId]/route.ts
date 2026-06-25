import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { db } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/api-auth";
import { CustomFieldOptions } from "@/lib/custom-fields";

const UpdateFieldBody = z.object({
  label: z.string().min(1).max(120).optional(),
  fieldType: z
    .enum([
      "TEXT",
      "NUMBER",
      "BOOLEAN",
      "DATE",
      "SELECT",
      "MULTI_SELECT",
      "CURRENCY",
      "EMAIL",
      "PHONE",
      "URL",
    ])
    .optional(),
  required: z.boolean().optional(),
  order: z.number().int().optional(),
  options: z.array(z.string()).optional(),
});

type Params = { params: Promise<{ fieldId: string }> };

export const GET = async (req: Request, { params }: Params) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { fieldId } = await params;
  const definition = await db.customFieldDefinition.findUnique({
    where: { id: fieldId, orgId: auth.apiKey.orgId },
  });
  if (!definition) return NextResponse.json({ error: "Field definition not found." }, { status: 404 });

  return NextResponse.json({ data: definition });
};

export const PATCH = async (req: Request, { params }: Params) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { fieldId } = await params;
  const orgId = auth.apiKey.orgId;

  const existing = await db.customFieldDefinition.findUnique({ where: { id: fieldId, orgId } });
  if (!existing) return NextResponse.json({ error: "Field definition not found." }, { status: 404 });

  const body = await req.json().catch(() => null);
  if (body === null) return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });

  const parsed = UpdateFieldBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed.", details: parsed.error.flatten() }, { status: 422 });
  }

  const { options, ...fields } = parsed.data;

  const definition = await db.customFieldDefinition.update({
    where: { id: fieldId, orgId },
    data: {
      ...fields,
      ...(options !== undefined
        ? { options: { options } satisfies CustomFieldOptions as Prisma.InputJsonObject }
        : {}),
    },
  });

  return NextResponse.json({ data: definition });
};

export const DELETE = async (req: Request, { params }: Params) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { fieldId } = await params;
  const existing = await db.customFieldDefinition.findUnique({
    where: { id: fieldId, orgId: auth.apiKey.orgId },
  });
  if (!existing) return NextResponse.json({ error: "Field definition not found." }, { status: 404 });

  await db.customFieldDefinition.delete({ where: { id: fieldId, orgId: auth.apiKey.orgId } });

  return NextResponse.json({ data: { id: fieldId } });
};
