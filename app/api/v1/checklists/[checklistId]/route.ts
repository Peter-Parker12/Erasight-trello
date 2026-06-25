import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/api-auth";

const UpdateChecklistBody = z.object({
  title: z.string().min(1).max(200).optional(),
  order: z.number().int().optional(),
});

type Params = { params: Promise<{ checklistId: string }> };

const findScoped = async (checklistId: string, orgId: string) =>
  db.checklist.findUnique({
    where: { id: checklistId },
    include: { card: { select: { list: { select: { board: { select: { orgId: true } } } } } } },
  });

export const GET = async (req: Request, { params }: Params) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { checklistId } = await params;
  const checklist = await findScoped(checklistId, auth.apiKey.orgId);
  if (!checklist || checklist.card.list.board.orgId !== auth.apiKey.orgId) {
    return NextResponse.json({ error: "Checklist not found." }, { status: 404 });
  }

  return NextResponse.json({ data: checklist });
};

export const PATCH = async (req: Request, { params }: Params) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { checklistId } = await params;
  const orgId = auth.apiKey.orgId;

  const existing = await findScoped(checklistId, orgId);
  if (!existing || existing.card.list.board.orgId !== orgId) {
    return NextResponse.json({ error: "Checklist not found." }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  if (body === null) return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });

  const parsed = UpdateChecklistBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed.", details: parsed.error.flatten() }, { status: 422 });
  }

  const checklist = await db.checklist.update({ where: { id: checklistId }, data: parsed.data });
  return NextResponse.json({ data: checklist });
};

export const DELETE = async (req: Request, { params }: Params) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { checklistId } = await params;
  const existing = await findScoped(checklistId, auth.apiKey.orgId);
  if (!existing || existing.card.list.board.orgId !== auth.apiKey.orgId) {
    return NextResponse.json({ error: "Checklist not found." }, { status: 404 });
  }

  await db.checklist.delete({ where: { id: checklistId } });
  return NextResponse.json({ data: { id: checklistId } });
};
