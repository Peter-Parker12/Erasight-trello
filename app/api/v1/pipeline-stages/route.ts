import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/api-auth";
import { pipelineStageBaseFields } from "@/lib/crm-schemas";

const CreateStageBody = z.object({
  ...pipelineStageBaseFields,
  order: z.number().int().optional(),
});

export const GET = async (req: Request) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 50, 1), 100);
  const offset = Math.max(Number(searchParams.get("offset")) || 0, 0);

  const where = { orgId: auth.apiKey.orgId };

  const [data, total] = await Promise.all([
    db.pipelineStage.findMany({ where, orderBy: { order: "asc" }, take: limit, skip: offset }),
    db.pipelineStage.count({ where }),
  ]);

  return NextResponse.json({ data, meta: { limit, offset, total } });
};

export const POST = async (req: Request) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => null);
  if (body === null) return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });

  const parsed = CreateStageBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed.", details: parsed.error.flatten() }, { status: 422 });
  }

  // Auto-assign order if not provided.
  const { order, ...fields } = parsed.data;
  let nextOrder = order;
  if (nextOrder === undefined) {
    const last = await db.pipelineStage.findFirst({
      where: { orgId: auth.apiKey.orgId },
      orderBy: { order: "desc" },
    });
    nextOrder = (last?.order ?? -1) + 1;
  }

  const stage = await db.pipelineStage.create({
    data: { orgId: auth.apiKey.orgId, ...fields, order: nextOrder },
  });

  return NextResponse.json({ data: stage }, { status: 201 });
};
