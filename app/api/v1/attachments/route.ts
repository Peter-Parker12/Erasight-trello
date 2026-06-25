import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/api-auth";

const CreateAttachmentBody = z.object({
  name: z.string().min(1).max(240),
  url: z.string().url(),
  cardId: z.string(),
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

  const data = await db.attachment.findMany({ where: { cardId }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ data });
};

export const POST = async (req: Request) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => null);
  if (body === null) return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });

  const parsed = CreateAttachmentBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed.", details: parsed.error.flatten() }, { status: 422 });
  }

  const { cardId, ...fields } = parsed.data;
  if (!(await resolveCardOrg(cardId, auth.apiKey.orgId))) {
    return NextResponse.json({ error: "Card not found." }, { status: 422 });
  }

  const attachment = await db.attachment.create({ data: { cardId, ...fields } });
  return NextResponse.json({ data: attachment }, { status: 201 });
};
