import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/api-auth";

const MoveBody = z.object({
  targetListId: z.string(),
  order: z.number().int().optional(),
});

type Params = { params: Promise<{ cardId: string }> };

export const POST = async (req: Request, { params }: Params) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { cardId } = await params;
  const orgId = auth.apiKey.orgId;

  const card = await db.card.findUnique({
    where: { id: cardId },
    include: { list: { select: { board: { select: { orgId: true } } } } },
  });
  if (!card || card.list.board.orgId !== orgId) {
    return NextResponse.json({ error: "Card not found." }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  if (body === null) return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });

  const parsed = MoveBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed.", details: parsed.error.flatten() }, { status: 422 });
  }

  const { targetListId, order } = parsed.data;

  const targetList = await db.list.findUnique({
    where: { id: targetListId },
    include: { board: { select: { orgId: true } } },
  });
  if (!targetList || targetList.board.orgId !== orgId) {
    return NextResponse.json({ error: "Target list not found." }, { status: 422 });
  }

  let nextOrder = order;
  if (nextOrder === undefined) {
    const last = await db.card.findFirst({ where: { listId: targetListId }, orderBy: { order: "desc" } });
    nextOrder = (last?.order ?? -1) + 1;
  }

  const updated = await db.card.update({
    where: { id: cardId },
    data: { listId: targetListId, order: nextOrder },
  });

  return NextResponse.json({ data: updated });
};
