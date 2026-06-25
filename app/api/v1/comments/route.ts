import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/api-auth";

const CreateCommentBody = z.object({
  content: z.string().min(1).max(5000),
  cardId: z.string(),
  imageUrl: z.string().url().nullable().optional(),
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
  const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 100, 1), 500);

  if (!cardId) {
    // Fall back to listing all comments in the org.
    const where = { orgId: auth.apiKey.orgId };
    const data = await db.comment.findMany({ where, orderBy: { createdAt: "desc" }, take: limit });
    return NextResponse.json({ data });
  }

  if (!(await resolveCardOrg(cardId, auth.apiKey.orgId))) {
    return NextResponse.json({ error: "Card not found." }, { status: 404 });
  }

  const data = await db.comment.findMany({ where: { cardId }, orderBy: { createdAt: "asc" }, take: limit });
  return NextResponse.json({ data });
};

export const POST = async (req: Request) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => null);
  if (body === null) return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });

  const parsed = CreateCommentBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed.", details: parsed.error.flatten() }, { status: 422 });
  }

  const { cardId } = parsed.data;
  if (!(await resolveCardOrg(cardId, auth.apiKey.orgId))) {
    return NextResponse.json({ error: "Card not found." }, { status: 422 });
  }

  const comment = await db.comment.create({
    data: {
      cardId,
      content: parsed.data.content,
      imageUrl: parsed.data.imageUrl ?? null,
      orgId: auth.apiKey.orgId,
      userId: `apikey:${auth.apiKey.id}`,
      userName: auth.apiKey.name,
      userImage: "",
    },
  });

  return NextResponse.json({ data: comment }, { status: 201 });
};
