import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { db } from "@/lib/db";
import { getEffectiveDueDate } from "@/lib/due-date";
import { Separator } from "@/components/ui/separator";
import { Info } from "../_components/info";
import { DueOverdueList, type DueCard } from "./_components/due-overdue-list";

const DashboardPage = async ({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}) => {
  const { organizationId } = await params;
  const { orgId } = await auth();
  if (!orgId) redirect("/select-org");

  // Admin-gated by the Dashboard layout, so this shows every board in the org.
  const cards = await db.card.findMany({
    where: {
      completed: false,
      OR: [{ dueDate: { not: null } }, { reviewDeadline: { not: null } }],
      list: {
        type: "STANDARD",
        board: { orgId },
      },
    },
    include: {
      list: { include: { board: { select: { id: true, title: true } } } },
    },
    take: 500,
  });

  const withDates = cards
    .map((card) => ({ card, eff: getEffectiveDueDate(card) }))
    .filter((x) => x.eff.date)
    .sort((a, b) => a.eff.date!.getTime() - b.eff.date!.getTime());

  const toDto = ({ card }: { card: (typeof cards)[number] }): DueCard => ({
    id: card.id,
    title: card.title,
    dueDate: card.dueDate ? card.dueDate.toISOString() : null,
    reviewDeadline: card.reviewDeadline ? card.reviewDeadline.toISOString() : null,
    boardId: card.list.board.id,
    boardTitle: card.list.board.title,
    listTitle: card.list.title,
  });

  const overdue = withDates.filter((x) => x.eff.overdue).map(toDto);
  const upcoming = withDates.filter((x) => !x.eff.overdue).map(toDto);

  return (
    <div className="w-full mb-20">
      <Info />
      <Separator className="my-4" />
      <div className="px-2 md:px-4 space-y-6">
        <div>
          <h2 className="text-sm font-semibold text-destructive mb-2">
            Overdue ({overdue.length})
          </h2>
          <DueOverdueList cards={overdue} variant="overdue" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-2">
            Upcoming ({upcoming.length})
          </h2>
          <DueOverdueList cards={upcoming} variant="upcoming" />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
