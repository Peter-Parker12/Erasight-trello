import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/api-auth";

// Subtasks are cards whose `parentCardId` is set. They live in the same list
// as their parent by default and inherit its org scope.

const CreateSubtaskBody = z.object({
  title: z.string().min(1).max(200),
  parentCardId: z.string(),
  order: z.number().int().optional(),
});

const resolveParentOrg = async (parentCardId: string, orgId: string) => {
  const parent = await db.card.findUnique({
    where: { id: parentCardId },
    include: { list: { select: { id: true, board: { select: { orgId: true } } } } },
  });
  if (!parent || parent.list.board.orgId !== orgId) return null;
  return parent;
};

export const GET = async (req: Request) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { searchParams } = new URL(req.url);
  const parentCardId = searchParams.get("parentCardId");
  if (!parentCardId) {
    return NextResponse.json({ error: "parentCardId query parameter is required." }, { status: 400 });
  }

  const parent = await resolveParentOrg(parentCardId, auth.apiKey.orgId);
  if (!parent) return NextResponse.json({ error: "Parent card not found." }, { status: 404 });

  const data = await db.card.findMany({
    where: { parentCardId },
    orderBy: { order: "asc" },
  });

  return NextResponse.json({ data });
};

export const POST = async (req: Request) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => null);
  if (body === null) return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });

  const parsed = CreateSubtaskBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed.", details: parsed.error.flatten() }, { status: 422 });
  }

  const { parentCardId, order, title } = parsed.data;
  const parent = await resolveParentOrg(parentCardId, auth.apiKey.orgId);
  if (!parent) return NextResponse.json({ error: "Parent card not found." }, { status: 422 });

  let nextOrder = order;
  if (nextOrder === undefined) {
    const last = await db.card.findFirst({ where: { parentCardId }, orderBy: { order: "desc" } });
    nextOrder = (last?.order ?? -1) + 1;
  }

  const subtask = await db.card.create({
    data: {
      title,
      parentCardId,
      listId: parent.listId,
      order: nextOrder,
    },
  });

  return NextResponse.json({ data: subtask }, { status: 201 });
};
