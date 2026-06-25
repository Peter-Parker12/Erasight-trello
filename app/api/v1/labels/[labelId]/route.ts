import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/api-auth";

const UpdateLabelBody = z.object({
  name: z.string().min(1).max(60).optional(),
  color: z.string().min(1).max(20).optional(),
});

type Params = { params: Promise<{ labelId: string }> };

const findScoped = async (labelId: string, orgId: string) =>
  db.label.findUnique({
    where: { id: labelId },
    include: { board: { select: { orgId: true } } },
  });

export const GET = async (req: Request, { params }: Params) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { labelId } = await params;
  const label = await findScoped(labelId, auth.apiKey.orgId);
  if (!label || label.board.orgId !== auth.apiKey.orgId) {
    return NextResponse.json({ error: "Label not found." }, { status: 404 });
  }

  return NextResponse.json({ data: label });
};

export const PATCH = async (req: Request, { params }: Params) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { labelId } = await params;
  const orgId = auth.apiKey.orgId;

  const existing = await findScoped(labelId, orgId);
  if (!existing || existing.board.orgId !== orgId) {
    return NextResponse.json({ error: "Label not found." }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  if (body === null) return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });

  const parsed = UpdateLabelBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed.", details: parsed.error.flatten() }, { status: 422 });
  }

  const label = await db.label.update({ where: { id: labelId }, data: parsed.data });
  return NextResponse.json({ data: label });
};

export const DELETE = async (req: Request, { params }: Params) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { labelId } = await params;
  const existing = await findScoped(labelId, auth.apiKey.orgId);
  if (!existing || existing.board.orgId !== auth.apiKey.orgId) {
    return NextResponse.json({ error: "Label not found." }, { status: 404 });
  }

  await db.label.delete({ where: { id: labelId } });
  return NextResponse.json({ data: { id: labelId } });
};
