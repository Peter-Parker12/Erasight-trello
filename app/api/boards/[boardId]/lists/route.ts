import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { db } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ boardId: string }> },
) {
  const { boardId } = await params;
  const { orgId } = await auth();
  if (!orgId) return new NextResponse("Unauthorized", { status: 401 });

  const lists = await db.list.findMany({
    where: { boardId, board: { orgId } },
    select: { id: true, title: true, order: true, type: true },
    orderBy: { order: "asc" },
  });

  return NextResponse.json(lists);
}
