import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { isOrgAdmin } from "@/lib/board-access";

export async function GET() {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return new NextResponse("Unauthorized", { status: 401 });

  const now = new Date();
  const admin = await isOrgAdmin(orgId);

  try {
    const overdueCards = await db.card.findMany({
      where: {
        completed: false,
        dueDate: { lt: now },
        list: {
          board: {
            orgId,
            ...(admin ? {} : { boardMembers: { some: { userId } } }),
          },
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
  } catch (error) {
    console.error("[OVERDUE_CARDS_GET]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
