import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/api-auth";

const UpdateCommentBody = z.object({
  content: z.string().min(1).max(5000).optional(),
  imageUrl: z.string().url().nullable().optional(),
});

type Params = { params: Promise<{ commentId: string }> };

export const GET = async (req: Request, { params }: Params) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { commentId } = await params;
  const comment = await db.comment.findUnique({
    where: { id: commentId, orgId: auth.apiKey.orgId },
  });
  if (!comment) return NextResponse.json({ error: "Comment not found." }, { status: 404 });

  return NextResponse.json({ data: comment });
};

export const PATCH = async (req: Request, { params }: Params) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { commentId } = await params;
  const orgId = auth.apiKey.orgId;

  const existing = await db.comment.findUnique({ where: { id: commentId, orgId } });
  if (!existing) return NextResponse.json({ error: "Comment not found." }, { status: 404 });

  const body = await req.json().catch(() => null);
  if (body === null) return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });

  const parsed = UpdateCommentBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed.", details: parsed.error.flatten() }, { status: 422 });
  }

  const comment = await db.comment.update({ where: { id: commentId }, data: parsed.data });
  return NextResponse.json({ data: comment });
};

export const DELETE = async (req: Request, { params }: Params) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { commentId } = await params;
  const existing = await db.comment.findUnique({
    where: { id: commentId, orgId: auth.apiKey.orgId },
  });
  if (!existing) return NextResponse.json({ error: "Comment not found." }, { status: 404 });

  await db.comment.delete({ where: { id: commentId } });
  return NextResponse.json({ data: { id: commentId } });
};
