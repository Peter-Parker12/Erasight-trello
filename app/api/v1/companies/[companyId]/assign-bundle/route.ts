import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/api-auth";

const AssignBody = z.object({ bundleId: z.string() });

type Params = { params: Promise<{ companyId: string }> };

export const POST = async (req: Request, { params }: Params) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { companyId } = await params;
  const orgId = auth.apiKey.orgId;

  const company = await db.company.findUnique({ where: { id: companyId, orgId }, select: { id: true } });
  if (!company) return NextResponse.json({ error: "Company not found." }, { status: 404 });

  const body = await req.json().catch(() => null);
  if (body === null) return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });

  const parsed = AssignBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed.", details: parsed.error.flatten() }, { status: 422 });
  }

  const bundle = await db.productBundle.findUnique({
    where: { id: parsed.data.bundleId, orgId },
    select: { id: true },
  });
  if (!bundle) return NextResponse.json({ error: "Bundle not found." }, { status: 422 });

  await db.companyBundle.upsert({
    where: { companyId_bundleId: { companyId, bundleId: parsed.data.bundleId } },
    create: { companyId, bundleId: parsed.data.bundleId },
    update: {},
  });

  return NextResponse.json({ data: { companyId, bundleId: parsed.data.bundleId } });
};
