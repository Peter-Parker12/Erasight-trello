import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { isOrgAdmin } from "@/lib/board-access";
import { getEffectiveDueDate } from "@/lib/due-date";

export async function GET() {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return new NextResponse("Unauthorized", { status: 401 });

  const now = new Date();
  const admin = await isOrgAdmin(orgId);

  try {
    const overdueCards = await db.card.findMany({
      where: {
        completed: false,
        OR: [{ dueDate: { lt: now } }, { reviewDeadline: { lt: now } }],
        list: {
          type: "STANDARD",
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
      take: 50,
    });

    const sorted = overdueCards
      .sort((a, b) => {
        const dateA = getEffectiveDueDate(a).date!;
        const dateB = getEffectiveDueDate(b).date!;
        return dateA.getTime() - dateB.getTime();
      })
      .slice(0, 20);

    return NextResponse.json(sorted);
  } catch (error) {
    console.error("[OVERDUE_CARDS_GET]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
