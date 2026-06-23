import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { isOrgAdmin } from "@/lib/board-access";

export async function GET() {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return new NextResponse("Unauthorized", { status: 401 });

  const admin = await isOrgAdmin(orgId);
  if (!admin) return new NextResponse("Forbidden", { status: 403 });

  const boards = await db.board.findMany({
    where: { orgId },
    include: { lists: { select: { type: true, order: true } } },
  });

  let boardsUpdated = 0;

  for (const board of boards) {
    const hasType = (type: "DONE" | "FAILED" | "CANCELLED") =>
      board.lists.some((l) => l.type === type);

    const maxOrder = board.lists.reduce((m, l) => Math.max(m, l.order), 0);

    const toCreate: { boardId: string; title: string; type: "DONE" | "FAILED" | "CANCELLED"; order: number }[] = [];
    let offset = 1;
    if (!hasType("DONE")) toCreate.push({ boardId: board.id, title: "Done", type: "DONE", order: maxOrder + offset++ });
    if (!hasType("FAILED")) toCreate.push({ boardId: board.id, title: "Failed", type: "FAILED", order: maxOrder + offset++ });
    if (!hasType("CANCELLED")) toCreate.push({ boardId: board.id, title: "Cancelled", type: "CANCELLED", order: maxOrder + offset++ });

    if (toCreate.length > 0) {
      await db.list.createMany({ data: toCreate });
      boardsUpdated++;
    }
  }

  // Backfill card completed field based on their current list type
  const updatedDoneCards = await db.card.updateMany({
    where: {
      list: { type: "DONE" },
      completed: false,
    },
    data: {
      completed: true,
    },
  });

  const updatedNonDoneCards = await db.card.updateMany({
    where: {
      list: { type: { not: "DONE" } },
      completed: true,
    },
    data: {
      completed: false,
    },
  });

  return NextResponse.json({
    totalBoards: boards.length,
    boardsUpdated,
    backfilledCompletedCards: updatedDoneCards.count,
    backfilledIncompleteCards: updatedNonDoneCards.count,
  });
}
