"use client";

import { useEffect, useState } from "react";
import { Search, X, SlidersHorizontal, Flag, Tag, User, CalendarClock } from "lucide-react";
import { useAuth } from "@clerk/nextjs";

import { FilterState, useBoardFilter } from "@/hooks/use-board-filter";
import { ListWithCards } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type BoardFilterBarProps = {
  lists: ListWithCards[];
  filter: FilterState;
  update: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  reset: () => void;
  isActive: boolean;
};

const PRIORITY_OPTIONS = [
  { value: "LOW", label: "Low", color: "bg-blue-400" },
  { value: "MEDIUM", label: "Medium", color: "bg-yellow-400" },
  { value: "HIGH", label: "High", color: "bg-orange-400" },
  { value: "URGENT", label: "Urgent", color: "bg-red-500" },
];

const DUE_OPTIONS = [
  { value: "overdue", label: "Overdue" },
  { value: "due_soon", label: "Due in 3 days" },
  { value: "no_date", label: "No due date" },
];

export const BoardFilterBar = ({ lists, filter, update, reset, isActive }: BoardFilterBarProps) => {
  const [expanded, setExpanded] = useState(false);

  // Collect unique labels and members from all cards
  const allCards = lists.flatMap((l) => l.cards);
  const labelsMap = new Map<string, { id: string; name: string; color: string }>();
  const membersMap = new Map<string, { userId: string; userName: string }>();

  for (const card of allCards) {
    for (const cl of card.labels) {
      labelsMap.set(cl.label.id, { id: cl.label.id, name: cl.label.name, color: cl.label.color });
    }
    for (const m of card.members) {
      membersMap.set(m.userId, { userId: m.userId, userName: m.userName });
    }
  }
  const labels = Array.from(labelsMap.values());
  const members = Array.from(membersMap.values());

  const totalActive = [filter.search, filter.priority, filter.labelId, filter.memberId, filter.dueFilter].filter(Boolean).length;

  return (
    <div className="bg-black/30 backdrop-blur-sm px-4 py-1.5 flex flex-col gap-2">
      {/* Top row — search + toggle */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/60" />
          <input
            value={filter.search}
            onChange={(e) => update("search", e.target.value)}
            placeholder="Search cards..."
            className="w-full pl-8 pr-3 py-1.5 text-sm bg-white/15 text-white placeholder-white/50 rounded-md border border-white/20 focus:outline-none focus:border-white/50 focus:bg-white/20"
          />
          {filter.search && (
            <button onClick={() => update("search", "")} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/60 hover:text-white">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        <button
          onClick={() => setExpanded((v) => !v)}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors",
            expanded || totalActive > 0
              ? "bg-white text-black"
              : "bg-white/15 text-white hover:bg-white/25 border border-white/20"
          )}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters
          {totalActive > 0 && (
            <span className="bg-sky-500 text-white rounded-full px-1.5 py-0.5 text-[10px] leading-none">{totalActive}</span>
          )}
        </button>

        {isActive && (
          <button onClick={reset} className="flex items-center gap-1 text-xs text-white/70 hover:text-white transition-colors">
            <X className="h-3 w-3" /> Clear all
          </button>
        )}
      </div>

      {/* Expanded filter row */}
      {expanded && (
        <div className="flex flex-wrap gap-2 pb-1">
          {/* Priority */}
          <div className="flex items-center gap-1">
            <Flag className="h-3.5 w-3.5 text-white/60" />
            <div className="flex gap-1">
              {PRIORITY_OPTIONS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => update("priority", filter.priority === p.value ? "" : p.value)}
                  className={cn(
                    "flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition-colors",
                    filter.priority === p.value
                      ? "bg-white text-black"
                      : "bg-white/15 text-white hover:bg-white/25 border border-white/20"
                  )}
                >
                  <span className={cn("h-2 w-2 rounded-full", p.color)} />
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Due filter */}
          <div className="flex items-center gap-1">
            <CalendarClock className="h-3.5 w-3.5 text-white/60" />
            <div className="flex gap-1">
              {DUE_OPTIONS.map((d) => (
                <button
                  key={d.value}
                  onClick={() => update("dueFilter", filter.dueFilter === d.value ? "" : d.value)}
                  className={cn(
                    "px-2 py-0.5 rounded text-xs font-medium transition-colors",
                    filter.dueFilter === d.value
                      ? "bg-white text-black"
                      : "bg-white/15 text-white hover:bg-white/25 border border-white/20"
                  )}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Labels */}
          {labels.length > 0 && (
            <div className="flex items-center gap-1">
              <Tag className="h-3.5 w-3.5 text-white/60" />
              <div className="flex gap-1">
                {labels.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => update("labelId", filter.labelId === l.id ? "" : l.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium transition-all",
                      filter.labelId === l.id ? "ring-2 ring-white" : "opacity-80 hover:opacity-100"
                    )}
                    style={{ backgroundColor: l.color, color: "#fff" }}
                  >
                    {l.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Members */}
          {members.length > 0 && (
            <div className="flex items-center gap-1">
              <User className="h-3.5 w-3.5 text-white/60" />
              <div className="flex gap-1">
                {members.map((m) => (
                  <button
                    key={m.userId}
                    onClick={() => update("memberId", filter.memberId === m.userId ? "" : m.userId)}
                    className={cn(
                      "px-2 py-0.5 rounded text-xs font-medium transition-colors",
                      filter.memberId === m.userId
                        ? "bg-white text-black"
                        : "bg-white/15 text-white hover:bg-white/25 border border-white/20"
                    )}
                  >
                    {m.userName}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
