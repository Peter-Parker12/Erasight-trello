"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  eachDayOfInterval, startOfDay, addDays, format, isToday, differenceInCalendarDays,
} from "date-fns";
import { Eye } from "lucide-react";
import { ListType } from "@prisma/client";

import { ListWithCards, CardPreview, SubtaskPreview } from "@/types";
import { useCardModal } from "@/hooks/use-card-modal";
import { cn } from "@/lib/utils";
import { getEffectiveDueDate } from "@/lib/due-date";

const DAY_WIDTH = 32;
const NAME_COL_WIDTH = 240;
const ROW_HEIGHT = 40;

const LIST_COLORS = ["#6366f1","#8b5cf6","#ec4899","#f43f5e","#f97316","#eab308","#22c55e","#14b8a6","#3b82f6","#06b6d4"];
const getListColor = (title: string): string => {
  let h = 0;
  for (let i = 0; i < title.length; i++) h = title.charCodeAt(i) + ((h << 5) - h);
  return LIST_COLORS[Math.abs(h) % LIST_COLORS.length];
};
const statusColor = (list: { type: ListType; title: string }): string => {
  if (list.type === "DONE") return "#22c55e";
  if (list.type === "FAILED") return "#ef4444";
  if (list.type === "CANCELLED") return "#6b7280";
  return getListColor(list.title);
};

type GanttRow = {
  card: CardPreview | SubtaskPreview;
  list: { title: string; type: ListType };
  depth: 0 | 1;
};

type GanttViewProps = {
  lists: ListWithCards[];
};

type GanttRowProps = {
  row: GanttRow;
  rangeStart: Date;
  trackWidth: number;
  onOpen: () => void;
};

const GanttRowItem = ({ row, rangeStart, trackWidth, onOpen }: GanttRowProps) => {
  const { card, list, depth } = row;
  const { date: due, isReview, overdue } = getEffectiveDueDate(card);

  const start = card.startDate ? startOfDay(new Date(card.startDate)) : null;
  const dueDay = due ? startOfDay(new Date(due)) : null;

  let barStart = start ?? dueDay;
  let barEnd = dueDay ?? start;
  if (barStart && barEnd && barStart > barEnd) {
    [barStart, barEnd] = [barEnd, barStart];
  }

  const color = statusColor(list);

  let barLeft = 0;
  let barWidth = 0;
  let elapsedWidth = 0;
  if (barStart && barEnd) {
    const today = startOfDay(new Date());
    barLeft = differenceInCalendarDays(barStart, rangeStart) * DAY_WIDTH;
    barWidth = (differenceInCalendarDays(barEnd, barStart) + 1) * DAY_WIDTH - 4;
    const elapsedEnd = card.completed ? barEnd : today < barStart ? barStart : today > barEnd ? barEnd : today;
    elapsedWidth = Math.max(0, Math.min((differenceInCalendarDays(elapsedEnd, barStart) + 1) * DAY_WIDTH - 4, barWidth));
  }

  return (
    <div className="flex border-b border-border hover:bg-muted/30 group" style={{ height: ROW_HEIGHT }}>
      <div
        className="sticky left-0 z-10 flex items-center gap-1.5 px-2 bg-card group-hover:bg-secondary border-r cursor-pointer overflow-hidden"
        style={{ width: NAME_COL_WIDTH, minWidth: NAME_COL_WIDTH }}
        onClick={onOpen}
      >
        {depth === 1 && <span className="w-4 shrink-0" />}
        <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
        <span className={cn(
          "truncate text-xs",
          card.completed ? "line-through text-muted-foreground" : depth === 1 ? "text-muted-foreground" : "text-foreground font-medium"
        )}>
          {card.title}
        </span>
        <span className="text-[10px] font-mono text-muted-foreground/50 shrink-0 ml-auto">#{card.cardNumber}</span>
      </div>

      <div className="relative" style={{ width: trackWidth }}>
        {barStart && barEnd ? (
          <button
            onClick={onOpen}
            title={`${card.title}: ${format(barStart, "MMM d")} – ${format(barEnd, "MMM d")}`}
            className={cn(
              "absolute top-1.5 rounded-md flex items-center px-1 overflow-hidden",
              overdue && "ring-2 ring-destructive"
            )}
            style={{ left: barLeft, width: Math.max(barWidth, 8), height: ROW_HEIGHT - 12, backgroundColor: `${color}33` }}
          >
            <div className="absolute inset-y-0 left-0 rounded-md" style={{ width: elapsedWidth, backgroundColor: color }} />
            {isReview && <Eye className="h-3 w-3 text-white relative shrink-0" />}
          </button>
        ) : (
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">No dates set</span>
        )}
      </div>
    </div>
  );
};

export const GanttView = ({ lists }: GanttViewProps) => {
  const cardModal = useCardModal();
  const scrollRef = useRef<HTMLDivElement>(null);

  const rows = useMemo<GanttRow[]>(() => {
    const result: GanttRow[] = [];
    for (const list of lists) {
      for (const card of list.cards) {
        result.push({ card, list: { title: list.title, type: list.type }, depth: 0 });
        for (const sub of card.subtasks) {
          result.push({ card: sub, list: sub.list, depth: 1 });
        }
      }
    }
    return result;
  }, [lists]);

  const { rangeStart, days } = useMemo(() => {
    const today = startOfDay(new Date());
    const times: number[] = [];
    for (const row of rows) {
      if (row.card.startDate) times.push(startOfDay(new Date(row.card.startDate)).getTime());
      const due = getEffectiveDueDate(row.card).date;
      if (due) times.push(startOfDay(new Date(due)).getTime());
    }

    let start: Date;
    let end: Date;
    if (times.length === 0) {
      start = addDays(today, -3);
      end = addDays(today, 14);
    } else {
      start = addDays(new Date(Math.min(...times)), -2);
      end = addDays(new Date(Math.max(...times)), 2);
    }

    return { rangeStart: start, days: eachDayOfInterval({ start, end }) };
  }, [rows]);

  const monthGroups = useMemo(() => {
    const groups: { label: string; width: number }[] = [];
    for (const day of days) {
      const label = format(day, "MMM yyyy");
      const last = groups[groups.length - 1];
      if (last && last.label === label) {
        last.width += DAY_WIDTH;
      } else {
        groups.push({ label, width: DAY_WIDTH });
      }
    }
    return groups;
  }, [days]);

  const trackWidth = days.length * DAY_WIDTH;
  const todayOffset = differenceInCalendarDays(startOfDay(new Date()), rangeStart) * DAY_WIDTH;
  const showTodayMarker = todayOffset >= 0 && todayOffset < trackWidth;

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollLeft = Math.max(0, todayOffset - scrollRef.current.clientWidth / 3);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeStart]);

  if (rows.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
        No cards yet. Switch to Board view to add cards.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background/90 rounded-lg overflow-hidden border border-border shadow-sm">
      <div ref={scrollRef} className="flex-1 overflow-auto">
        <div className="relative" style={{ width: NAME_COL_WIDTH + trackWidth }}>
          {showTodayMarker && (
            <div
              className="absolute top-0 bottom-0 w-px bg-primary pointer-events-none"
              style={{ left: NAME_COL_WIDTH + todayOffset + DAY_WIDTH / 2 }}
            />
          )}

          {/* Header */}
          <div className="flex sticky top-0 z-20 bg-background">
            <div
              className="sticky left-0 z-30 flex items-center px-2 bg-background border-r border-b text-xs font-semibold text-muted-foreground"
              style={{ width: NAME_COL_WIDTH, minWidth: NAME_COL_WIDTH }}
            >
              Task
            </div>
            <div className="border-b">
              <div className="flex">
                {monthGroups.map((g, i) => (
                  <div
                    key={i}
                    className="text-center text-[10px] font-medium text-muted-foreground py-0.5 border-r border-border"
                    style={{ width: g.width }}
                  >
                    {g.label}
                  </div>
                ))}
              </div>
              <div className="flex">
                {days.map((day) => (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "shrink-0 text-center text-[10px] py-0.5 border-r border-border",
                      isToday(day) ? "text-primary font-bold bg-primary/10" : "text-muted-foreground"
                    )}
                    style={{ width: DAY_WIDTH }}
                  >
                    {format(day, "d")}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Rows */}
          {rows.map((row) => (
            <GanttRowItem
              key={row.card.id}
              row={row}
              rangeStart={rangeStart}
              trackWidth={trackWidth}
              onOpen={() => cardModal.onOpen(row.card.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
