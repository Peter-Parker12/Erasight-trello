import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/api-auth";

const CreateLabelBody = z.object({
  name: z.string().min(1).max(60),
  color: z.string().min(1).max(20),
  boardId: z.string(),
});

export const GET = async (req: Request) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { searchParams } = new URL(req.url);
  const boardId = searchParams.get("boardId");
  if (!boardId) return NextResponse.json({ error: "boardId query parameter is required." }, { status: 400 });

  const board = await db.board.findUnique({
    where: { id: boardId, orgId: auth.apiKey.orgId },
    select: { id: true },
  });
  if (!board) return NextResponse.json({ error: "Board not found." }, { status: 404 });

  const data = await db.label.findMany({ where: { boardId }, orderBy: { createdAt: "asc" } });
  return NextResponse.json({ data });
};

export const POST = async (req: Request) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => null);
  if (body === null) return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });

  const parsed = CreateLabelBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed.", details: parsed.error.flatten() }, { status: 422 });
  }

  const { boardId, ...fields } = parsed.data;
  const board = await db.board.findUnique({
    where: { id: boardId, orgId: auth.apiKey.orgId },
    select: { id: true },
  });
  if (!board) return NextResponse.json({ error: "Board not found." }, { status: 422 });

  const label = await db.label.create({ data: { boardId, ...fields } });
  return NextResponse.json({ data: label }, { status: 201 });
};
