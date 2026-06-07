"use client";

import { useState, useCallback } from "react";
import { CardPreview } from "@/types";

export type FilterState = {
  search: string;
  priority: string;   // "" | "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  labelId: string;    // "" | labelId
  memberId: string;   // "" | userId
  dueFilter: string;  // "" | "overdue" | "due_soon" | "no_date"
};

const INITIAL: FilterState = {
  search: "",
  priority: "",
  labelId: "",
  memberId: "",
  dueFilter: "",
};

export function useBoardFilter() {
  const [filter, setFilter] = useState<FilterState>(INITIAL);

  const update = useCallback(<K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilter((prev) => ({ ...prev, [key]: value }));
  }, []);

  const reset = useCallback(() => setFilter(INITIAL), []);

  const isActive = Object.values(filter).some(Boolean);

  const applyFilter = useCallback((cards: CardPreview[]): CardPreview[] => {
    const now = new Date();
    return cards.filter((card) => {
      if (filter.search) {
        if (!card.title.toLowerCase().includes(filter.search.toLowerCase())) return false;
      }
      if (filter.priority) {
        if (card.priority !== filter.priority) return false;
      }
      if (filter.labelId) {
        if (!card.labels.some((cl) => cl.labelId === filter.labelId)) return false;
      }
      if (filter.memberId) {
        if (!card.members.some((m) => m.userId === filter.memberId)) return false;
      }
      if (filter.dueFilter) {
        const due = card.dueDate ? new Date(card.dueDate) : null;
        if (filter.dueFilter === "overdue") {
          if (!due || card.completed || due >= now) return false;
        } else if (filter.dueFilter === "due_soon") {
          if (!due || card.completed || due < now || due.getTime() - now.getTime() > 86400000 * 3) return false;
        } else if (filter.dueFilter === "no_date") {
          if (due) return false;
        }
      }
      return true;
    });
  }, [filter]);

  return { filter, update, reset, isActive, applyFilter };
}
