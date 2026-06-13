import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { ListContainer } from "./_components/list-container";
import { ListView } from "./_components/list-view";
import { CalendarView } from "./_components/calendar-view";
import { GanttView } from "./_components/gantt-view";
import { CardDeepLink } from "./_components/card-deep-link";
import { db } from "@/lib/db";

type BoardIdPageProps = {
  params: Promise<{
    boardId: string;
  }>;
  searchParams: Promise<{ view?: string }>;
};

const BoardIdPage = async ({ params, searchParams }: BoardIdPageProps) => {
  const { boardId } = await params;
  const { view } = await searchParams;
  const { orgId } = await auth();

  if (!orgId) redirect("/select-org");

  const lists = await db.list.findMany({
    where: {
      boardId: boardId,
      board: {
        orgId,
      },
    },
    include: {
      cards: {
        where: { parentCardId: null },
        orderBy: { order: "asc" },
        include: {
          labels: { include: { label: true } },
          members: true,
          checklists: { include: { items: true } },
          _count: { select: { comments: true, attachments: true } },
          subtasks: {
            orderBy: { createdAt: "asc" },
            include: { members: true, list: { select: { id: true, title: true, type: true } } },
          },
        },
      },
    },
    orderBy: {
      order: "asc",
    },
  });

  return (
    <div className={view === "board" ? "h-full overflow-x-auto" : "p-4 h-full overflow-x-auto"}>
      <CardDeepLink />
      {view === "list" ? (
        <ListView lists={lists} />
      ) : view === "calendar" ? (
        <CalendarView lists={lists} />
      ) : view === "gantt" ? (
        <GanttView lists={lists} />
      ) : (
        <ListContainer boardId={boardId} data={lists} />
      )}
    </div>
  );
};

export default BoardIdPage;
