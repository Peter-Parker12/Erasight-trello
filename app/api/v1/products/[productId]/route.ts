import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { db } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/api-auth";
import { productBaseFields } from "@/lib/crm-schemas";
import { getFieldDefinitions, validateCustomFields } from "@/lib/custom-fields";

const UpdateProductBody = z.object(productBaseFields).partial();

type Params = { params: Promise<{ productId: string }> };

export const GET = async (req: Request, { params }: Params) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { productId } = await params;
  const product = await db.product.findUnique({
    where: { id: productId, orgId: auth.apiKey.orgId },
  });
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  return NextResponse.json({ data: product });
};

export const PATCH = async (req: Request, { params }: Params) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { productId } = await params;
  const orgId = auth.apiKey.orgId;

  const existing = await db.product.findUnique({ where: { id: productId, orgId } });
  if (!existing) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  const body = await req.json().catch(() => null);
  if (body === null) return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });

  const parsed = UpdateProductBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed.", details: parsed.error.flatten() }, { status: 422 });
  }

  const { customFields, ...fields } = parsed.data;

  let customFieldsData: Prisma.InputJsonObject | undefined;
  if (customFields !== undefined) {
    const definitions = await getFieldDefinitions(orgId, "PRODUCT");
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

  const product = await db.product.update({
    where: { id: productId, orgId },
    data: { ...fields, ...(customFieldsData ? { customFields: customFieldsData } : {}) },
  });

  return NextResponse.json({ data: product });
};

export const DELETE = async (req: Request, { params }: Params) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { productId } = await params;
  const existing = await db.product.findUnique({
    where: { id: productId, orgId: auth.apiKey.orgId },
  });
  if (!existing) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  await db.product.delete({ where: { id: productId, orgId: auth.apiKey.orgId } });

  return NextResponse.json({ data: { id: productId } });
};
