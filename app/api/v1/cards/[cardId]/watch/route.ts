import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/api-auth";

// API keys are not user-bound; we synthesize a stable pseudo-userId derived
// from the API key so watch state can still be toggled through the public API.
const WatchBody = z.object({ watch: z.boolean().optional() });

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

  const body = await req.json().catch(() => ({}));
  const parsed = WatchBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed.", details: parsed.error.flatten() }, { status: 422 });
  }

  // API key acts as the synthetic viewer.
  const pseudoUserId = `apikey:${auth.apiKey.id}`;
  const desired = parsed.data.watch ?? true;

  const existing = await db.cardWatcher.findUnique({
    where: { cardId_userId: { cardId, userId: pseudoUserId } },
  });

  if (desired && !existing) {
    await db.cardWatcher.create({ data: { cardId, userId: pseudoUserId } });
  } else if (!desired && existing) {
    await db.cardWatcher.delete({ where: { id: existing.id } });
  }

  return NextResponse.json({ data: { cardId, watching: desired } });
};
