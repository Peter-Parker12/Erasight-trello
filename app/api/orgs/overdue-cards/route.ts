import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function GET() {
  const { orgId } = await auth();
  if (!orgId) return new NextResponse("Unauthorized", { status: 401 });

  const now = new Date();

  const overdueCards = await db.card.findMany({
    where: {
      completed: false,
      dueDate: { lt: now },
      list: {
        board: { orgId },
      },
    },
    include: {
      list: {
        include: {
          board: { select: { id: true, title: true } },
        },
      },
    },
    orderBy: { dueDate: "asc" },
    take: 20,
  });

  return NextResponse.json(overdueCards);
}
