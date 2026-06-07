import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { isOrgAdmin } from "@/lib/board-access";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ boardId: string }> },
) {
  try {
    const { boardId } = await params;
    const { userId, orgId } = await auth();
    if (!userId || !orgId) return new NextResponse("Unauthorized", { status: 401 });

    const admin = await isOrgAdmin(orgId);
    if (!admin) return new NextResponse("Forbidden", { status: 403 });

    const board = await db.board.findUnique({ where: { id: boardId, orgId } });
    if (!board) return new NextResponse("Not found", { status: 404 });

    const [config, lists] = await Promise.all([
      db.boardTelegramConfig.findUnique({ where: { boardId } }),
      db.list.findMany({ where: { boardId }, orderBy: { order: "asc" }, select: { id: true, title: true } }),
    ]);

    return NextResponse.json({ config, lists });
  } catch (e) {
    console.error(e);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
