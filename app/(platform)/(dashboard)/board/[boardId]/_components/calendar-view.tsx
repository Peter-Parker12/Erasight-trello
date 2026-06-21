"use client";

import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, isToday,
  format, addMonths, subMonths,
} from "date-fns";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Eye } from "lucide-react";

import { ListWithCards, CardPreview } from "@/types";
import { useCardModal } from "@/hooks/use-card-modal";
import { cn } from "@/lib/utils";
import { getEffectiveDueDate } from "@/lib/due-date";

type CalendarViewProps = {
  lists: ListWithCards[];
};

const PRIORITY_DOT: Record<string, string> = {
  NONE: "bg-[#555]",
  LOW: "bg-blue-400",
  MEDIUM: "bg-yellow-400",
  HIGH: "bg-orange-400",
  URGENT: "bg-red-500",
};

type CalendarCardProps = { card: CardPreview };

const CalendarCard = ({ card }: CalendarCardProps) => {
  const cardModal = useCardModal();
  const { isReview, overdue } = getEffectiveDueDate(card);

  return (
    <button
      onClick={() => cardModal.onOpen(card.id)}
      className={cn(
        "w-full text-left text-[11px] px-1.5 py-0.5 rounded truncate flex items-center gap-1 leading-tight",
        card.completed
          ? "bg-green-500/20 text-green-400 line-through"
          : overdue
          ? "bg-red-500/20 text-red-400 font-medium"
          : card.coverColor
          ? "text-white font-medium"
          : "bg-[#2a2a2a] border border-[#333] text-muted-foreground hover:border-[#888]"
      )}
      style={card.coverColor && !card.completed ? { backgroundColor: card.coverColor } : undefined}
      title={card.title}
    >
      {isReview && <Eye className="h-2.5 w-2.5 shrink-0" />}
      {card.priority !== "NONE" && (
        <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", PRIORITY_DOT[card.priority])} />
      )}
      <span className="truncate">{card.title}</span>
    </button>
  );
};

export const CalendarView = ({ lists }: CalendarViewProps) => {
  const [current, setCurrent] = useState(new Date());

  // Map effective due date (dueDate or reviewDeadline) → cards
  const cardsByDate = new Map<string, CardPreview[]>();
  for (const list of lists) {
    for (const card of list.cards) {
      const { date } = getEffectiveDueDate(card);
      if (!date) continue;
      const key = format(date, "yyyy-MM-dd");
      if (!cardsByDate.has(key)) cardsByDate.set(key, []);
      cardsByDate.get(key)!.push(card);
    }
  }

  const monthStart = startOfMonth(current);
  const monthEnd = endOfMonth(current);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const noDateCards = lists.flatMap((l) => l.cards).filter((c) => !getEffectiveDueDate(c).date);

  return (
    <div className="flex flex-col h-full bg-[#171717]/90 rounded-lg overflow-hidden border border-[#333] shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/20 text-white">
        <button
          onClick={() => setCurrent((d) => subMonths(d, 1))}
          className="p-1 rounded hover:bg-white/10 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h2 className="text-sm font-semibold">{format(current, "MMMM yyyy")}</h2>
        <button
          onClick={() => setCurrent((d) => addMonths(d, 1))}
          className="p-1 rounded hover:bg-white/10 transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Day name headers */}
      <div className="grid grid-cols-7 bg-[#2a2a2a] border-b">
        {DAY_NAMES.map((d) => (
          <div key={d} className="py-1.5 text-center text-xs font-medium text-muted-foreground">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="flex-1 grid grid-cols-7 auto-rows-fr overflow-y-auto">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayCards = cardsByDate.get(key) ?? [];
          const inMonth = isSameMonth(day, current);
          const today = isToday(day);
          const MAX_VISIBLE = 3;

          return (
            <div
              key={key}
              className={cn(
                "min-h-[80px] p-1 border-b border-r border-gray-100",
                !inMonth && "bg-[#1a1a1a] opacity-60"
              )}
            >
              {/* Day number */}
              <div className={cn(
                "text-xs font-medium w-5 h-5 flex items-center justify-center rounded-full mb-1",
                today ? "bg-violet-500 text-white" : "text-muted-foreground"
              )}>
                {format(day, "d")}
              </div>

              {/* Cards */}
              <div className="space-y-0.5">
                {dayCards.slice(0, MAX_VISIBLE).map((card) => (
                  <CalendarCard key={card.id} card={card} />
                ))}
                {dayCards.length > MAX_VISIBLE && (
                  <p className="text-[10px] text-muted-foreground px-1">
                    +{dayCards.length - MAX_VISIBLE} more
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* No date cards footer */}
      {noDateCards.length > 0 && (
        <div className="border-t bg-[#1f1f1f] px-4 py-2">
          <p className="text-xs text-muted-foreground mb-1.5 font-medium">
            {noDateCards.length} card{noDateCards.length > 1 ? "s" : ""} with no due date
          </p>
          <div className="flex flex-wrap gap-1">
            {noDateCards.slice(0, 8).map((card) => (
              <CalendarCard key={card.id} card={card} />
            ))}
            {noDateCards.length > 8 && (
              <span className="text-[10px] text-muted-foreground self-center">+{noDateCards.length - 8}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
