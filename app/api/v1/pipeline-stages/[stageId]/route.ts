import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/api-auth";
import { pipelineStageBaseFields } from "@/lib/crm-schemas";

const UpdateStageBody = z.object(pipelineStageBaseFields).partial();

type Params = { params: Promise<{ stageId: string }> };

export const GET = async (req: Request, { params }: Params) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { stageId } = await params;
  const stage = await db.pipelineStage.findUnique({
    where: { id: stageId, orgId: auth.apiKey.orgId },
  });
  if (!stage) return NextResponse.json({ error: "Pipeline stage not found." }, { status: 404 });

  return NextResponse.json({ data: stage });
};

export const PATCH = async (req: Request, { params }: Params) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { stageId } = await params;
  const orgId = auth.apiKey.orgId;

  const existing = await db.pipelineStage.findUnique({ where: { id: stageId, orgId } });
  if (!existing) return NextResponse.json({ error: "Pipeline stage not found." }, { status: 404 });

  const body = await req.json().catch(() => null);
  if (body === null) return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });

  const parsed = UpdateStageBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed.", details: parsed.error.flatten() }, { status: 422 });
  }

  const stage = await db.pipelineStage.update({
    where: { id: stageId, orgId },
    data: parsed.data,
  });

  return NextResponse.json({ data: stage });
};

export const DELETE = async (req: Request, { params }: Params) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { stageId } = await params;
  const existing = await db.pipelineStage.findUnique({
    where: { id: stageId, orgId: auth.apiKey.orgId },
  });
  if (!existing) return NextResponse.json({ error: "Pipeline stage not found." }, { status: 404 });

  await db.pipelineStage.delete({ where: { id: stageId, orgId: auth.apiKey.orgId } });

  return NextResponse.json({ data: { id: stageId } });
};
