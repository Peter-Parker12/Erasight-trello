import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ boardId: string }> },
) {
  try {
    const { boardId } = await params;
    const { userId, orgId } = await auth();
    if (!userId || !orgId) return new NextResponse("Unauthorized", { status: 401 });

    const board = await db.board.findUnique({ where: { id: boardId, orgId } });
    if (!board) return new NextResponse("Not found", { status: 404 });

    const client = await clerkClient();
    const [boardMembers, orgMemberList] = await Promise.all([
      db.boardMember.findMany({ where: { boardId } }),
      client.organizations.getOrganizationMembershipList({ organizationId: orgId, limit: 100 }),
    ]);

    const boardMemberIds = new Set(boardMembers.map((m) => m.userId));

    const orgMembers = orgMemberList.data.map((m) => ({
      userId: m.publicUserData?.userId ?? "",
      userName: `${m.publicUserData?.firstName ?? ""} ${m.publicUserData?.lastName ?? ""}`.trim()
        || m.publicUserData?.identifier
        || "Unknown",
      userImage: m.publicUserData?.imageUrl ?? "",
      role: m.role,
      isBoardMember: boardMemberIds.has(m.publicUserData?.userId ?? ""),
    }));

    return NextResponse.json({ boardMembers, orgMembers });
  } catch (e) {
    console.error(e);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
