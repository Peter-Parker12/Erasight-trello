import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/api-auth";

const ListType = z.enum(["STANDARD", "DONE", "FAILED", "CANCELLED"]);

const CreateListBody = z.object({
  title: z.string().min(1).max(120),
  boardId: z.string(),
  order: z.number().int().optional(),
  wipLimit: z.number().int().nullable().optional(),
  type: ListType.optional(),
});

export const GET = async (req: Request) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { searchParams } = new URL(req.url);
  const boardId = searchParams.get("boardId");
  if (!boardId) {
    return NextResponse.json({ error: "boardId query parameter is required." }, { status: 400 });
  }

  // Verify board belongs to org before exposing its lists.
  const board = await db.board.findUnique({
    where: { id: boardId, orgId: auth.apiKey.orgId },
    select: { id: true },
  });
  if (!board) return NextResponse.json({ error: "Board not found." }, { status: 404 });

  const data = await db.list.findMany({ where: { boardId }, orderBy: { order: "asc" } });
  return NextResponse.json({ data });
};

export const POST = async (req: Request) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => null);
  if (body === null) return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });

  const parsed = CreateListBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed.", details: parsed.error.flatten() }, { status: 422 });
  }

  const { boardId } = parsed.data;
  const board = await db.board.findUnique({
    where: { id: boardId, orgId: auth.apiKey.orgId },
    select: { id: true },
  });
  if (!board) return NextResponse.json({ error: "Board not found." }, { status: 422 });

  let order = parsed.data.order;
  if (order === undefined) {
    const last = await db.list.findFirst({ where: { boardId }, orderBy: { order: "desc" } });
    order = (last?.order ?? -1) + 1;
  }

  const list = await db.list.create({
    data: {
      boardId,
      title: parsed.data.title,
      order,
      wipLimit: parsed.data.wipLimit ?? null,
      type: parsed.data.type ?? "STANDARD",
    },
  });

  return NextResponse.json({ data: list }, { status: 201 });
};
