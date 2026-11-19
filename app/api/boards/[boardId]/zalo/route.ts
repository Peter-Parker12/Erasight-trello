import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { canPerform } from "@/lib/rbac";
import { ACTIONS } from "@/lib/rbac-actions";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ boardId: string }> },
) {
  try {
    const { boardId } = await params;
    const { userId, orgId } = await auth();
    if (!userId || !orgId) return new NextResponse("Unauthorized", { status: 401 });

    if (!(await canPerform(orgId, userId, ACTIONS.BOARD_ZALO_MANAGE))) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const board = await db.board.findUnique({ where: { id: boardId, orgId } });
    if (!board) return new NextResponse("Not found", { status: 404 });

    const config = await db.boardZaloConfig.findUnique({ where: { boardId } });

    return NextResponse.json({ config });
  } catch (e) {
    console.error(e);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
