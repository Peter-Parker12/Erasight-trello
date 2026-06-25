import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/api-auth";

const CreateChecklistBody = z.object({
  title: z.string().min(1).max(200),
  cardId: z.string(),
  order: z.number().int().optional(),
});

const resolveCardOrg = async (cardId: string, orgId: string) => {
  const card = await db.card.findUnique({
    where: { id: cardId },
    include: { list: { select: { board: { select: { orgId: true } } } } },
  });
  if (!card || card.list.board.orgId !== orgId) return null;
  return card;
};

export const GET = async (req: Request) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { searchParams } = new URL(req.url);
  const cardId = searchParams.get("cardId");
  if (!cardId) return NextResponse.json({ error: "cardId query parameter is required." }, { status: 400 });

  if (!(await resolveCardOrg(cardId, auth.apiKey.orgId))) {
    return NextResponse.json({ error: "Card not found." }, { status: 404 });
  }

  const data = await db.checklist.findMany({
    where: { cardId },
    orderBy: { order: "asc" },
    include: { items: { orderBy: { order: "asc" } } },
  });

  return NextResponse.json({ data });
};

export const POST = async (req: Request) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => null);
  if (body === null) return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });

  const parsed = CreateChecklistBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed.", details: parsed.error.flatten() }, { status: 422 });
  }

  const { cardId, order, ...fields } = parsed.data;
  if (!(await resolveCardOrg(cardId, auth.apiKey.orgId))) {
    return NextResponse.json({ error: "Card not found." }, { status: 422 });
  }

  let nextOrder = order;
  if (nextOrder === undefined) {
    const last = await db.checklist.findFirst({ where: { cardId }, orderBy: { order: "desc" } });
    nextOrder = (last?.order ?? -1) + 1;
  }

  const checklist = await db.checklist.create({ data: { cardId, order: nextOrder, ...fields } });
  return NextResponse.json({ data: checklist }, { status: 201 });
};
