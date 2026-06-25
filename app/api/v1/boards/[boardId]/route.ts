import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/api-auth";

const UpdateBoardBody = z.object({
  title: z.string().min(1).max(120).optional(),
  backgroundType: z.enum(["image", "color"]).optional(),
  backgroundColor: z.string().max(20).nullable().optional(),
});

type Params = { params: Promise<{ boardId: string }> };

export const GET = async (req: Request, { params }: Params) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { boardId } = await params;
  const board = await db.board.findUnique({
    where: { id: boardId, orgId: auth.apiKey.orgId },
  });
  if (!board) return NextResponse.json({ error: "Board not found." }, { status: 404 });

  return NextResponse.json({ data: board });
};

export const PATCH = async (req: Request, { params }: Params) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { boardId } = await params;
  const orgId = auth.apiKey.orgId;

  const existing = await db.board.findUnique({ where: { id: boardId, orgId } });
  if (!existing) return NextResponse.json({ error: "Board not found." }, { status: 404 });

  const body = await req.json().catch(() => null);
  if (body === null) return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });

  const parsed = UpdateBoardBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed.", details: parsed.error.flatten() }, { status: 422 });
  }

  const board = await db.board.update({ where: { id: boardId, orgId }, data: parsed.data });
  return NextResponse.json({ data: board });
};

export const DELETE = async (req: Request, { params }: Params) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { boardId } = await params;
  const existing = await db.board.findUnique({ where: { id: boardId, orgId: auth.apiKey.orgId } });
  if (!existing) return NextResponse.json({ error: "Board not found." }, { status: 404 });

  await db.board.delete({ where: { id: boardId, orgId: auth.apiKey.orgId } });

  return NextResponse.json({ data: { id: boardId } });
};
