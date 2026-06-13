import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { db } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ cardId: string }> },
) {
  try {
    const { cardId } = await params;
    const { userId, orgId } = await auth();

    if (!userId || !orgId)
      return new NextResponse("Unauthorized", { status: 401 });

    const card = await db.card.findUnique({
      where: {
        id: cardId,
        list: { board: { orgId } },
      },
      include: {
        list: {
          select: {
            title: true,
            board: { select: { telegramConfig: { select: { reviewListId: true } } } },
          },
        },
        labels: { include: { label: true } },
        members: true,
        checklists: {
          include: { items: { orderBy: { order: "asc" } } },
          orderBy: { order: "asc" },
        },
        comments: { orderBy: { createdAt: "desc" } },
        attachments: { orderBy: { createdAt: "desc" } },
        subtasks: {
          orderBy: { order: "asc" },
          include: { members: true },
        },
      },
    });

    if (!card) return NextResponse.json(card);

    return NextResponse.json({
      ...card,
      list: { title: card.list.title },
      reviewListId: card.list.board.telegramConfig?.reviewListId ?? null,
    });
  } catch (error) {
    console.error("[/api/cards/:id GET]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

