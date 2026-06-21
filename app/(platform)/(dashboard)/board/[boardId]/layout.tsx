import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { BoardNavbar } from "./_components/board-navbar";
import { db } from "@/lib/db";
import { canAccessBoard, isOrgAdmin } from "@/lib/board-access";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ boardId: string }>;
}) {
  const { boardId } = await params;
  const { orgId } = await auth();

  if (!orgId) return { title: "Board" };

  const board = await db.board.findUnique({
    where: {
      id: boardId,
      orgId,
    },
  });

  return {
    title: board?.title || "Board",
  };
}

const BoardIdLayout = async ({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ boardId: string }>;
}) => {
  const { boardId } = await params;
  const { orgId } = await auth();

  if (!orgId) redirect("/select-org");

  const board = await db.board.findUnique({
    where: {
      id: boardId,
      orgId,
    },
  });

  if (!board) notFound();

  const hasAccess = await canAccessBoard(boardId, orgId);
  if (!hasAccess) notFound();

  const admin = await isOrgAdmin(orgId);

  const bgStyle: React.CSSProperties =
    board.backgroundType === "color"
      ? { backgroundColor: board.backgroundColor ?? "#1e3a5f" }
      : board.backgroundType === "gradient"
      ? { background: board.backgroundColor ?? "linear-gradient(135deg, #667eea, #764ba2)" }
      : { backgroundImage: `url(${board.imageFullUrl})` };

  return (
    <div
      style={bgStyle}
      className="relative h-full bg-no-repeat bg-cover bg-center"
    >
      <BoardNavbar data={board} isAdmin={admin} />
      <div aria-hidden className="absolute inset-0 bg-black/50" />
      <main className="relative pt-28 h-full">{children}</main>
    </div>
  );
};

export default BoardIdLayout;
