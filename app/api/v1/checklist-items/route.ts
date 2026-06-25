import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/api-auth";

const CreateItemBody = z.object({
  content: z.string().min(1).max(1000),
  checklistId: z.string(),
  completed: z.boolean().optional(),
  order: z.number().int().optional(),
});

const resolveChecklistOrg = async (checklistId: string, orgId: string) => {
  const checklist = await db.checklist.findUnique({
    where: { id: checklistId },
    include: { card: { select: { list: { select: { board: { select: { orgId: true } } } } } } },
  });
  if (!checklist || checklist.card.list.board.orgId !== orgId) return null;
  return checklist;
};

export const GET = async (req: Request) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { searchParams } = new URL(req.url);
  const checklistId = searchParams.get("checklistId");
  if (!checklistId) return NextResponse.json({ error: "checklistId query parameter is required." }, { status: 400 });

  if (!(await resolveChecklistOrg(checklistId, auth.apiKey.orgId))) {
    return NextResponse.json({ error: "Checklist not found." }, { status: 404 });
  }

  const data = await db.checklistItem.findMany({ where: { checklistId }, orderBy: { order: "asc" } });
  return NextResponse.json({ data });
};

export const POST = async (req: Request) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => null);
  if (body === null) return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });

  const parsed = CreateItemBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed.", details: parsed.error.flatten() }, { status: 422 });
  }

  const { checklistId, order, ...fields } = parsed.data;
  if (!(await resolveChecklistOrg(checklistId, auth.apiKey.orgId))) {
    return NextResponse.json({ error: "Checklist not found." }, { status: 422 });
  }

  let nextOrder = order;
  if (nextOrder === undefined) {
    const last = await db.checklistItem.findFirst({ where: { checklistId }, orderBy: { order: "desc" } });
    nextOrder = (last?.order ?? -1) + 1;
  }

  const item = await db.checklistItem.create({ data: { checklistId, order: nextOrder, ...fields } });
  return NextResponse.json({ data: item }, { status: 201 });
};
