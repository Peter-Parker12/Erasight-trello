import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/api-auth";

const ProductsBody = z.object({
  productIds: z.array(z.string()),
});

type Params = { params: Promise<{ leadId: string }> };

export const POST = async (req: Request, { params }: Params) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { leadId } = await params;
  const orgId = auth.apiKey.orgId;

  const lead = await db.lead.findUnique({ where: { id: leadId, orgId }, select: { id: true } });
  if (!lead) return NextResponse.json({ error: "Lead not found." }, { status: 404 });

  const body = await req.json().catch(() => null);
  if (body === null) return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });

  const parsed = ProductsBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed.", details: parsed.error.flatten() }, { status: 422 });
  }

  const { productIds } = parsed.data;

  // Verify all products belong to this org.
  if (productIds.length > 0) {
    const found = await db.product.findMany({
      where: { id: { in: productIds }, orgId },
      select: { id: true },
    });
    if (found.length !== productIds.length) {
      return NextResponse.json({ error: "One or more products not found." }, { status: 422 });
    }
  }

  await db.$transaction([
    db.leadProduct.deleteMany({ where: { leadId } }),
    ...productIds.map((productId) => db.leadProduct.create({ data: { leadId, productId } })),
  ]);

  return NextResponse.json({ data: { leadId, productIds } });
};
