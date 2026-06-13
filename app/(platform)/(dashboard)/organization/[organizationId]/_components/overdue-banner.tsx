"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CalendarDays, ChevronDown, ChevronUp, Eye } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { useState } from "react";
import Link from "next/link";

import { fetcher } from "@/lib/fetcher";

type OverdueCard = {
  id: string;
  title: string;
  dueDate: string | null;
  reviewDeadline: string | null;
  list: {
    title: string;
    board: { id: string; title: string };
  };
};

export const OverdueBanner = () => {
  const [expanded, setExpanded] = useState(false);

  const { data: cards, isLoading } = useQuery<OverdueCard[]>({
    queryKey: ["overdue-cards"],
    queryFn: () => fetcher("/api/orgs/overdue-cards"),
    refetchInterval: 60000, // refresh every minute
  });

  if (isLoading || !cards || cards.length === 0) return null;

  const shown = expanded ? cards : cards.slice(0, 3);

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 overflow-hidden mb-4">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-red-100 border-b border-red-200">
        <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
        <p className="text-sm font-semibold text-red-700 flex-1">
          {cards.length} card{cards.length > 1 ? "s" : ""} overdue
        </p>
        {cards.length > 3 && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-xs text-red-500 hover:text-red-700 flex items-center gap-0.5"
          >
            {expanded ? <><ChevronUp className="h-3.5 w-3.5" /> Show less</> : <><ChevronDown className="h-3.5 w-3.5" /> Show all {cards.length}</>}
          </button>
        )}
      </div>

      {/* Card list */}
      <div className="divide-y divide-red-100">
        {shown.map((card) => {
          const isReview = !card.dueDate && !!card.reviewDeadline;
          const due = new Date(card.dueDate ?? card.reviewDeadline!);
          return (
            <Link
              key={card.id}
              href={`/board/${card.list.board.id}?card=${card.id}`}
              className="flex items-center gap-3 px-4 py-2 hover:bg-red-100/50 transition-colors cursor-pointer"
            >
              {isReview ? (
                <Eye className="h-3.5 w-3.5 text-red-500 shrink-0" />
              ) : (
                <CalendarDays className="h-3.5 w-3.5 text-red-500 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{card.title}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {card.list.board.title} › {card.list.title}
                  {isReview && " · Review deadline"}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs font-semibold text-red-600">{format(due, "MMM d")}</p>
                <p className="text-[10px] text-red-400">{formatDistanceToNow(due, { addSuffix: true })}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
