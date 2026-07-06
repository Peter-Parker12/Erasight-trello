import Link from "next/link";
import { CalendarDays, Eye } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

import { cn } from "@/lib/utils";

export type DueCard = {
  id: string;
  title: string;
  dueDate: string | null;
  reviewDeadline: string | null;
  boardId: string;
  boardTitle: string;
  listTitle: string;
};

type DueOverdueListProps = {
  cards: DueCard[];
  variant: "overdue" | "upcoming";
};

export const DueOverdueList = ({ cards, variant }: DueOverdueListProps) => {
  if (cards.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2">
        {variant === "overdue" ? "Nothing overdue. 🎉" : "No upcoming due tasks."}
      </p>
    );
  }

  const isOverdue = variant === "overdue";

  return (
    <div
      className={cn(
        "rounded-lg border divide-y overflow-hidden",
        isOverdue ? "border-red-900/40 divide-red-900/40" : "border-[#333] divide-[#333]"
      )}
    >
      {cards.map((card) => {
        const isReview = !card.dueDate && !!card.reviewDeadline;
        const due = new Date(card.dueDate ?? card.reviewDeadline!);
        return (
          <Link
            key={card.id}
            href={`/board/${card.boardId}?card=${card.id}`}
            className="flex items-center gap-3 px-4 py-2 hover:bg-[#2a2a2a] transition-colors"
          >
            {isReview ? (
              <Eye className={cn("h-3.5 w-3.5 shrink-0", isOverdue ? "text-red-500" : "text-muted-foreground")} />
            ) : (
              <CalendarDays className={cn("h-3.5 w-3.5 shrink-0", isOverdue ? "text-red-500" : "text-muted-foreground")} />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#e5e5e5] truncate">{card.title}</p>
              <p className="text-xs text-muted-foreground truncate">
                {card.boardTitle} › {card.listTitle}
                {isReview && " · Review deadline"}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className={cn("text-xs font-semibold", isOverdue ? "text-red-500" : "text-[#e5e5e5]")}>
                {format(due, "MMM d")}
              </p>
              <p className={cn("text-[10px]", isOverdue ? "text-red-400" : "text-muted-foreground")}>
                {formatDistanceToNow(due, { addSuffix: true })}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
};
