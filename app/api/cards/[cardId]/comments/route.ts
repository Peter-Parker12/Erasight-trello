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
    if (!userId || !orgId) return new NextResponse("Unauthorized", { status: 401 });

    const comments = await db.comment.findMany({
      where: {
        cardId,
        orgId,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(comments);
  } catch {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
