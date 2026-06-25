import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/api-auth";

const Priority = z.enum(["NONE", "LOW", "MEDIUM", "HIGH", "URGENT"]);

const UpdateCardBody = z.object({
  title: z.string().min(1).max(200).optional(),
  listId: z.string().optional(),
  order: z.number().int().optional(),
  description: z.string().nullable().optional(),
  priority: Priority.optional(),
  dueDate: z.string().datetime().nullable().optional(),
  startDate: z.string().datetime().nullable().optional(),
  completed: z.boolean().optional(),
});

type Params = { params: Promise<{ cardId: string }> };

const findScoped = async (cardId: string, orgId: string) =>
  db.card.findUnique({
    where: { id: cardId },
    include: { list: { select: { board: { select: { orgId: true } } } } },
  });

export const GET = async (req: Request, { params }: Params) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { cardId } = await params;
  const card = await findScoped(cardId, auth.apiKey.orgId);
  if (!card || card.list.board.orgId !== auth.apiKey.orgId) {
    return NextResponse.json({ error: "Card not found." }, { status: 404 });
  }

  return NextResponse.json({ data: card });
};

export const PATCH = async (req: Request, { params }: Params) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { cardId } = await params;
  const orgId = auth.apiKey.orgId;

  const existing = await findScoped(cardId, orgId);
  if (!existing || existing.list.board.orgId !== orgId) {
    return NextResponse.json({ error: "Card not found." }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  if (body === null) return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });

  const parsed = UpdateCardBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed.", details: parsed.error.flatten() }, { status: 422 });
  }

  const { listId, dueDate, startDate, ...fields } = parsed.data;

  if (listId && listId !== existing.listId) {
    const targetList = await db.list.findUnique({
      where: { id: listId },
      include: { board: { select: { orgId: true } } },
    });
    if (!targetList || targetList.board.orgId !== orgId) {
      return NextResponse.json({ error: "Target list not found." }, { status: 422 });
    }
  }

  const card = await db.card.update({
    where: { id: cardId },
    data: {
      ...fields,
      ...(listId !== undefined ? { listId } : {}),
      ...(dueDate !== undefined ? { dueDate: dueDate ? new Date(dueDate) : null } : {}),
      ...(startDate !== undefined ? { startDate: startDate ? new Date(startDate) : null } : {}),
    },
  });

  return NextResponse.json({ data: card });
};

export const DELETE = async (req: Request, { params }: Params) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { cardId } = await params;
  const existing = await findScoped(cardId, auth.apiKey.orgId);
  if (!existing || existing.list.board.orgId !== auth.apiKey.orgId) {
    return NextResponse.json({ error: "Card not found." }, { status: 404 });
  }

  await db.card.delete({ where: { id: cardId } });
  return NextResponse.json({ data: { id: cardId } });
};
