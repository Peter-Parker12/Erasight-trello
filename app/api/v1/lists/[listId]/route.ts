import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/api-auth";

const ListType = z.enum(["STANDARD", "DONE", "FAILED", "CANCELLED"]);

const UpdateListBody = z.object({
  title: z.string().min(1).max(120).optional(),
  order: z.number().int().optional(),
  wipLimit: z.number().int().nullable().optional(),
  type: ListType.optional(),
});

type Params = { params: Promise<{ listId: string }> };

// Fetch the list joined with its board and verify the board belongs to the
// org derived from the API key.
const findScoped = async (listId: string, orgId: string) =>
  db.list.findUnique({
    where: { id: listId },
    include: { board: { select: { orgId: true } } },
  });

export const GET = async (req: Request, { params }: Params) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { listId } = await params;
  const list = await findScoped(listId, auth.apiKey.orgId);
  if (!list || list.board.orgId !== auth.apiKey.orgId) {
    return NextResponse.json({ error: "List not found." }, { status: 404 });
  }

  return NextResponse.json({ data: list });
};

export const PATCH = async (req: Request, { params }: Params) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { listId } = await params;
  const orgId = auth.apiKey.orgId;

  const existing = await findScoped(listId, orgId);
  if (!existing || existing.board.orgId !== orgId) {
    return NextResponse.json({ error: "List not found." }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  if (body === null) return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });

  const parsed = UpdateListBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed.", details: parsed.error.flatten() }, { status: 422 });
  }

  const list = await db.list.update({ where: { id: listId }, data: parsed.data });
  return NextResponse.json({ data: list });
};

export const DELETE = async (req: Request, { params }: Params) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { listId } = await params;
  const existing = await findScoped(listId, auth.apiKey.orgId);
  if (!existing || existing.board.orgId !== auth.apiKey.orgId) {
    return NextResponse.json({ error: "List not found." }, { status: 404 });
  }

  await db.list.delete({ where: { id: listId } });
  return NextResponse.json({ data: { id: listId } });
};
