import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/api-auth";

const UpdateSubtaskBody = z.object({
  title: z.string().min(1).max(200).optional(),
  order: z.number().int().optional(),
  completed: z.boolean().optional(),
});

type Params = { params: Promise<{ subtaskId: string }> };

const findScoped = async (subtaskId: string, orgId: string) => {
  const card = await db.card.findUnique({
    where: { id: subtaskId },
    include: { list: { select: { board: { select: { orgId: true } } } } },
  });
  if (!card || !card.parentCardId || card.list.board.orgId !== orgId) return null;
  return card;
};

export const GET = async (req: Request, { params }: Params) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { subtaskId } = await params;
  const subtask = await findScoped(subtaskId, auth.apiKey.orgId);
  if (!subtask) return NextResponse.json({ error: "Subtask not found." }, { status: 404 });

  return NextResponse.json({ data: subtask });
};

export const PATCH = async (req: Request, { params }: Params) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { subtaskId } = await params;
  const orgId = auth.apiKey.orgId;

  const existing = await findScoped(subtaskId, orgId);
  if (!existing) return NextResponse.json({ error: "Subtask not found." }, { status: 404 });

  const body = await req.json().catch(() => null);
  if (body === null) return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });

  const parsed = UpdateSubtaskBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed.", details: parsed.error.flatten() }, { status: 422 });
  }

  const subtask = await db.card.update({ where: { id: subtaskId }, data: parsed.data });
  return NextResponse.json({ data: subtask });
};

export const DELETE = async (req: Request, { params }: Params) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { subtaskId } = await params;
  const existing = await findScoped(subtaskId, auth.apiKey.orgId);
  if (!existing) return NextResponse.json({ error: "Subtask not found." }, { status: 404 });

  await db.card.delete({ where: { id: subtaskId } });
  return NextResponse.json({ data: { id: subtaskId } });
};
