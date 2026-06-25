import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/api-auth";

const Priority = z.enum(["NONE", "LOW", "MEDIUM", "HIGH", "URGENT"]);

const CreateCardBody = z.object({
  title: z.string().min(1).max(200),
  listId: z.string(),
  order: z.number().int().optional(),
  description: z.string().nullable().optional(),
  priority: Priority.optional(),
  dueDate: z.string().datetime().nullable().optional(),
  startDate: z.string().datetime().nullable().optional(),
  completed: z.boolean().optional(),
});

export const GET = async (req: Request) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { searchParams } = new URL(req.url);
  const listId = searchParams.get("listId");
  const boardId = searchParams.get("boardId");
  const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 100, 1), 500);

  if (!listId && !boardId) {
    return NextResponse.json({ error: "Provide either listId or boardId query parameter." }, { status: 400 });
  }

  // Verify org scope.
  if (boardId) {
    const board = await db.board.findUnique({
      where: { id: boardId, orgId: auth.apiKey.orgId },
      select: { id: true },
    });
    if (!board) return NextResponse.json({ error: "Board not found." }, { status: 404 });
  }
  if (listId) {
    const list = await db.list.findUnique({
      where: { id: listId },
      include: { board: { select: { orgId: true } } },
    });
    if (!list || list.board.orgId !== auth.apiKey.orgId) {
      return NextResponse.json({ error: "List not found." }, { status: 404 });
    }
  }

  const where = {
    ...(listId ? { listId } : {}),
    ...(boardId ? { list: { boardId } } : {}),
  };

  const data = await db.card.findMany({
    where,
    orderBy: { order: "asc" },
    take: limit,
  });

  return NextResponse.json({ data });
};

export const POST = async (req: Request) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => null);
  if (body === null) return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });

  const parsed = CreateCardBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed.", details: parsed.error.flatten() }, { status: 422 });
  }

  const { listId, order, dueDate, startDate, ...fields } = parsed.data;

  const list = await db.list.findUnique({
    where: { id: listId },
    include: { board: { select: { orgId: true } } },
  });
  if (!list || list.board.orgId !== auth.apiKey.orgId) {
    return NextResponse.json({ error: "List not found." }, { status: 422 });
  }

  let nextOrder = order;
  if (nextOrder === undefined) {
    const last = await db.card.findFirst({ where: { listId }, orderBy: { order: "desc" } });
    nextOrder = (last?.order ?? -1) + 1;
  }

  const card = await db.card.create({
    data: {
      listId,
      order: nextOrder,
      ...fields,
      ...(dueDate ? { dueDate: new Date(dueDate) } : {}),
      ...(startDate ? { startDate: new Date(startDate) } : {}),
    },
  });

  return NextResponse.json({ data: card }, { status: 201 });
};
