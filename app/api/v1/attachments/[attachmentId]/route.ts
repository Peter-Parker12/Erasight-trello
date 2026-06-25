import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/api-auth";

const UpdateAttachmentBody = z.object({
  name: z.string().min(1).max(240).optional(),
  url: z.string().url().optional(),
});

type Params = { params: Promise<{ attachmentId: string }> };

const findScoped = async (attachmentId: string, orgId: string) =>
  db.attachment.findUnique({
    where: { id: attachmentId },
    include: { card: { select: { list: { select: { board: { select: { orgId: true } } } } } } },
  });

export const GET = async (req: Request, { params }: Params) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { attachmentId } = await params;
  const attachment = await findScoped(attachmentId, auth.apiKey.orgId);
  if (!attachment || attachment.card.list.board.orgId !== auth.apiKey.orgId) {
    return NextResponse.json({ error: "Attachment not found." }, { status: 404 });
  }

  return NextResponse.json({ data: attachment });
};

export const PATCH = async (req: Request, { params }: Params) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { attachmentId } = await params;
  const orgId = auth.apiKey.orgId;

  const existing = await findScoped(attachmentId, orgId);
  if (!existing || existing.card.list.board.orgId !== orgId) {
    return NextResponse.json({ error: "Attachment not found." }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  if (body === null) return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });

  const parsed = UpdateAttachmentBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed.", details: parsed.error.flatten() }, { status: 422 });
  }

  const attachment = await db.attachment.update({ where: { id: attachmentId }, data: parsed.data });
  return NextResponse.json({ data: attachment });
};

export const DELETE = async (req: Request, { params }: Params) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { attachmentId } = await params;
  const existing = await findScoped(attachmentId, auth.apiKey.orgId);
  if (!existing || existing.card.list.board.orgId !== auth.apiKey.orgId) {
    return NextResponse.json({ error: "Attachment not found." }, { status: 404 });
  }

  await db.attachment.delete({ where: { id: attachmentId } });
  return NextResponse.json({ data: { id: attachmentId } });
};
