import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/api-auth";
import { bundleBaseFields } from "@/lib/crm-schemas";

const CreateBundleBody = z.object(bundleBaseFields);

export const GET = async (req: Request) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 50, 1), 100);
  const offset = Math.max(Number(searchParams.get("offset")) || 0, 0);

  const where = { orgId: auth.apiKey.orgId };

  const [data, total] = await Promise.all([
    db.productBundle.findMany({
      where,
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    db.productBundle.count({ where }),
  ]);

  return NextResponse.json({ data, meta: { limit, offset, total } });
};

export const POST = async (req: Request) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => null);
  if (body === null) return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });

  const parsed = CreateBundleBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed.", details: parsed.error.flatten() }, { status: 422 });
  }

  const { items, ...fields } = parsed.data;

  // Verify all products belong to this org before creating the bundle.
  const productIds = items.map((i) => i.productId);
  const orgProducts = await db.product.findMany({
    where: { id: { in: productIds }, orgId: auth.apiKey.orgId },
    select: { id: true, unitPrice: true },
  });
  const orgProductMap = new Map(orgProducts.map((p) => [p.id, p]));
  for (const item of items) {
    if (!orgProductMap.has(item.productId)) {
      return NextResponse.json({ error: `Product ${item.productId} not found.` }, { status: 422 });
    }
  }

  const bundle = await db.productBundle.create({
    data: {
      orgId: auth.apiKey.orgId,
      ...fields,
      items: {
        create: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
      },
    },
    include: { items: { include: { product: true } } },
  });

  return NextResponse.json({ data: bundle }, { status: 201 });
};
