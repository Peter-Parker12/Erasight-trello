import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/api-auth";

const UpdateItemBody = z.object({
  content: z.string().min(1).max(1000).optional(),
  completed: z.boolean().optional(),
  order: z.number().int().optional(),
});

type Params = { params: Promise<{ itemId: string }> };

const findScoped = async (itemId: string, orgId: string) =>
  db.checklistItem.findUnique({
    where: { id: itemId },
    include: {
      checklist: { select: { card: { select: { list: { select: { board: { select: { orgId: true } } } } } } } },
    },
  });

export const GET = async (req: Request, { params }: Params) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { itemId } = await params;
  const item = await findScoped(itemId, auth.apiKey.orgId);
  if (!item || item.checklist.card.list.board.orgId !== auth.apiKey.orgId) {
    return NextResponse.json({ error: "Checklist item not found." }, { status: 404 });
  }

  return NextResponse.json({ data: item });
};

export const PATCH = async (req: Request, { params }: Params) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { itemId } = await params;
  const orgId = auth.apiKey.orgId;

  const existing = await findScoped(itemId, orgId);
  if (!existing || existing.checklist.card.list.board.orgId !== orgId) {
    return NextResponse.json({ error: "Checklist item not found." }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  if (body === null) return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });

  const parsed = UpdateItemBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed.", details: parsed.error.flatten() }, { status: 422 });
  }

  const item = await db.checklistItem.update({ where: { id: itemId }, data: parsed.data });
  return NextResponse.json({ data: item });
};

export const DELETE = async (req: Request, { params }: Params) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { itemId } = await params;
  const existing = await findScoped(itemId, auth.apiKey.orgId);
  if (!existing || existing.checklist.card.list.board.orgId !== auth.apiKey.orgId) {
    return NextResponse.json({ error: "Checklist item not found." }, { status: 404 });
  }

  await db.checklistItem.delete({ where: { id: itemId } });
  return NextResponse.json({ data: { id: itemId } });
};
