import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ boardId: string }> }) {
  const { boardId } = await params;
  const { orgId } = await auth();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [config, lists] = await Promise.all([
    db.boardAiConfig.findUnique({ where: { boardId } }),
    db.list.findMany({
      where: { boardId, board: { orgId } },
      select: { id: true, title: true },
      orderBy: { order: "asc" },
    }),
  ]);

  return NextResponse.json({ config, lists });
}

export async function POST(req: Request, { params }: { params: Promise<{ boardId: string }> }) {
  const { boardId } = await params;
  const { orgId } = await auth();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { reviewListId, enabled } = await req.json();

  const config = await db.boardAiConfig.upsert({
    where: { boardId },
    create: { boardId, reviewListId: reviewListId || null, enabled: enabled ?? true },
    update: { reviewListId: reviewListId || null, enabled: enabled ?? true },
  });

  return NextResponse.json({ data: config });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ boardId: string }> }) {
  const { boardId } = await params;
  const { orgId } = await auth();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await db.boardAiConfig.deleteMany({ where: { boardId } });
  return NextResponse.json({ data: null });
}
