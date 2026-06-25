import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/api-auth";
import { bundleBaseFields } from "@/lib/crm-schemas";

const UpdateBundleBody = z.object(bundleBaseFields).partial();

type Params = { params: Promise<{ bundleId: string }> };

const findScoped = async (bundleId: string, orgId: string) =>
  db.productBundle.findUnique({
    where: { id: bundleId, orgId },
    include: { items: true },
  });

export const GET = async (req: Request, { params }: Params) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { bundleId } = await params;
  const bundle = await findScoped(bundleId, auth.apiKey.orgId);
  if (!bundle) return NextResponse.json({ error: "Bundle not found." }, { status: 404 });

  return NextResponse.json({ data: bundle });
};

export const PATCH = async (req: Request, { params }: Params) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { bundleId } = await params;
  const orgId = auth.apiKey.orgId;

  const existing = await findScoped(bundleId, orgId);
  if (!existing) return NextResponse.json({ error: "Bundle not found." }, { status: 404 });

  const body = await req.json().catch(() => null);
  if (body === null) return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });

  const parsed = UpdateBundleBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed.", details: parsed.error.flatten() }, { status: 422 });
  }

  const { items, ...fields } = parsed.data;

  // If items are provided, replace them wholesale.
  let itemsOp: { deleteMany: Record<string, never> } | { create: Array<{ productId: string; quantity: number; unitPrice: number }> } | undefined;
  if (items) {
    const productIds = items.map((i) => i.productId);
    const orgProducts = await db.product.findMany({
      where: { id: { in: productIds }, orgId },
      select: { id: true },
    });
    const validIdSet = new Set(orgProducts.map((p) => p.id));
    for (const item of items) {
      if (!validIdSet.has(item.productId)) {
        return NextResponse.json({ error: `Product ${item.productId} not found.` }, { status: 422 });
      }
    }
    await db.productBundleItem.deleteMany({ where: { bundleId } });
    itemsOp = {
      create: items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
    };
  }

  const bundle = await db.productBundle.update({
    where: { id: bundleId, orgId },
    data: { ...fields, ...(itemsOp ? { items: itemsOp } : {}) },
    include: { items: { include: { product: true } } },
  });

  return NextResponse.json({ data: bundle });
};

export const DELETE = async (req: Request, { params }: Params) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { bundleId } = await params;
  const existing = await findScoped(bundleId, auth.apiKey.orgId);
  if (!existing) return NextResponse.json({ error: "Bundle not found." }, { status: 404 });

  await db.productBundle.delete({ where: { id: bundleId, orgId: auth.apiKey.orgId } });

  return NextResponse.json({ data: { id: bundleId } });
};
