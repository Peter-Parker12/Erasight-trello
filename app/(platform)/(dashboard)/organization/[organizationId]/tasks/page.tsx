import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { Separator } from "@/components/ui/separator";
import { db } from "@/lib/db";
import { isOrgAdmin } from "@/lib/board-access";
import { checkSubscription } from "@/lib/subscription";
import { Info } from "../_components/info";
import { MyTasksView } from "./_components/my-tasks-view";

interface Props {
  params: Promise<{ organizationId: string }>;
}

const TasksPage = async ({ params }: Props) => {
  const { organizationId } = await params;
  const { userId, orgId } = await auth();

  if (!userId || !orgId) redirect("/select-org");
  if (orgId !== organizationId) redirect(`/organization/${orgId}/tasks`);

  const isPro = await checkSubscription();
  const admin = await isOrgAdmin(orgId);

  const cards = await db.card.findMany({
    where: {
      parentCardId: null,
      list: { board: { orgId } },
      ...(admin ? {} : { members: { some: { userId } } }),
    },
    include: {
      labels: { include: { label: true } },
      members: true,
      checklists: { include: { items: true } },
      _count: { select: { comments: true, attachments: true } },
      subtasks: { orderBy: { createdAt: "asc" }, include: { members: true } },
      list: { include: { board: { select: { id: true, title: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="w-full mb-20">
      <Info isPro={isPro} />
      <Separator className="my-4" />
      <div className="px-2 md:px-4">
        <MyTasksView cards={cards as any} isAdmin={admin} />
      </div>
    </div>
  );
};

export default TasksPage;
