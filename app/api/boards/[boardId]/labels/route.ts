import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ boardId: string }> },
) {
  try {
    const { boardId } = await params;
    const { userId, orgId } = await auth();
    if (!userId || !orgId) return new NextResponse("Unauthorized", { status: 401 });

    const labels = await db.label.findMany({
      where: { boardId, board: { orgId } },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(labels);
  } catch {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
