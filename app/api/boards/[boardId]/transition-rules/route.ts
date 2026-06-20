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

  const board = await db.board.findUnique({ where: { id: boardId, orgId } });
  if (!board) return new NextResponse("Not found", { status: 404 });

  const rules = await db.listTransitionRule.findMany({ where: { boardId } });

  // Return a map of listId → actions[] for O(1) lookup on the client.
  const map: Record<string, string[]> = {};
  for (const rule of rules) {
    map[rule.listId] = rule.actions as string[];
  }

  return NextResponse.json(map);
}
