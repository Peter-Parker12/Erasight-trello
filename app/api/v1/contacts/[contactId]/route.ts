import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { db } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/api-auth";
import { contactBaseFields } from "@/lib/crm-schemas";
import { getFieldDefinitions, validateCustomFields } from "@/lib/custom-fields";

const UpdateContactBody = z.object(contactBaseFields).partial();

type Params = { params: Promise<{ contactId: string }> };

export const GET = async (req: Request, { params }: Params) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { contactId } = await params;
  const contact = await db.contact.findUnique({ where: { id: contactId, orgId: auth.apiKey.orgId } });
  if (!contact) return NextResponse.json({ error: "Contact not found." }, { status: 404 });

  return NextResponse.json({ data: contact });
};

export const PATCH = async (req: Request, { params }: Params) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { contactId } = await params;
  const existing = await db.contact.findUnique({ where: { id: contactId, orgId: auth.apiKey.orgId } });
  if (!existing) return NextResponse.json({ error: "Contact not found." }, { status: 404 });

  const body = await req.json().catch(() => null);
  if (body === null) return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });

  const parsed = UpdateContactBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed.", details: parsed.error.flatten() }, { status: 422 });
  }

  const { customFields, ...fields } = parsed.data;

  if (fields.companyId) {
    const company = await db.company.findUnique({ where: { id: fields.companyId, orgId: auth.apiKey.orgId } });
    if (!company) return NextResponse.json({ error: "Company not found." }, { status: 422 });
  }

  let customFieldsData: Prisma.InputJsonObject | undefined;
  if (customFields !== undefined) {
    const definitions = await getFieldDefinitions(auth.apiKey.orgId, "CONTACT");
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

  const contact = await db.contact.update({
    where: { id: contactId, orgId: auth.apiKey.orgId },
    data: { ...fields, ...(customFieldsData ? { customFields: customFieldsData } : {}) },
  });

  return NextResponse.json({ data: contact });
};

export const DELETE = async (req: Request, { params }: Params) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { contactId } = await params;
  const existing = await db.contact.findUnique({ where: { id: contactId, orgId: auth.apiKey.orgId } });
  if (!existing) return NextResponse.json({ error: "Contact not found." }, { status: 404 });

  await db.contact.delete({ where: { id: contactId, orgId: auth.apiKey.orgId } });

  return NextResponse.json({ data: { id: contactId } });
};
