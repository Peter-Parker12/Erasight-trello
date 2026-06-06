import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { ListContainer } from "./_components/list-container";
import { db } from "@/lib/db";

type BoardIdPageProps = {
  params: Promise<{
    boardId: string;
  }>;
};

const BoardIdPage = async ({ params }: BoardIdPageProps) => {
  const { boardId } = await params;
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
        orderBy: { order: "asc" },
        include: {
          labels: { include: { label: true } },
          members: true,
          checklists: { include: { items: true } },
          _count: { select: { comments: true, attachments: true } },
        },
      },
    },
    orderBy: {
      order: "asc",
    },
  });

  return (
    <div className="p-4 h-full overflow-x-auto">
      <ListContainer boardId={boardId} data={lists} />
    </div>
  );
};

export default BoardIdPage;
