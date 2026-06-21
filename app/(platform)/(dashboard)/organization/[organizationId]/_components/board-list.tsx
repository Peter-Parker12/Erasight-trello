import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { User2 } from "lucide-react";

import { BoardMembers } from "@/app/(platform)/(dashboard)/board/[boardId]/_components/board-members";

import { Skeleton } from "@/components/ui/skeleton";

import { FormPopover } from "@/components/form/form-popover";
import { db } from "@/lib/db";
import { isOrgAdmin } from "@/lib/board-access";

export const BoardList = async () => {
  const { orgId, userId } = await auth();

  if (!orgId || !userId) return redirect("/select-org");

  const admin = await isOrgAdmin(orgId);

  const boards = await db.board.findMany({
    where: {
      orgId,
      ...(admin
        ? {}
        : {
            OR: [
              { boardMembers: { none: {} } },
              { boardMembers: { some: { userId } } },
            ],
          }),
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center font-semibold text-lg text-[#e5e5e5]">
        <User2 className="h-6 w-6 mr-2" />
        Your boards
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {boards.map((board) => (
          <div key={board.id} className="group relative aspect-video">
            <Link
              href={`/board/${board.id}`}
              style={{ backgroundImage: `url(${board.imageThumbUrl})` }}
              className="absolute inset-0 bg-no-repeat bg-center bg-cover bg-sky-700 rounded-sm p-2 overflow-hidden"
            >
              <div
                aria-hidden
                className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition"
              />
              <p className="relative font-semibold text-white">{board.title}</p>
            </Link>
            {admin && (
              <div className="absolute bottom-1 right-1 z-10">
                <BoardMembers boardId={board.id} compact />
              </div>
            )}
          </div>
        ))}
        {admin && (
          <FormPopover sideOffset={10} side="right">
            <div
              role="button"
              className="relative aspect-video h-full w-full bg-muted rounded-sm flex flex-col gap-y-1 items-center justify-center hover:opacity-75 transition"
            >
              <p className="text-sm">Create new board</p>
            </div>
          </FormPopover>
        )}
      </div>
    </div>
  );
};

BoardList.Skeleton = function SkeletonBoardList() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
      <Skeleton className="aspect-video h-full w-full p-2" />
      <Skeleton className="aspect-video h-full w-full p-2" />
      <Skeleton className="aspect-video h-full w-full p-2" />
      <Skeleton className="aspect-video h-full w-full p-2" />
      <Skeleton className="aspect-video h-full w-full p-2" />
      <Skeleton className="aspect-video h-full w-full p-2" />
      <Skeleton className="aspect-video h-full w-full p-2" />
      <Skeleton className="aspect-video h-full w-full p-2" />
    </div>
  );
};
