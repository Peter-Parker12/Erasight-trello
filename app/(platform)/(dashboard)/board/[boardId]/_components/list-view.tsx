"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { CalendarDays, CheckSquare, Eye, MessageSquare, Paperclip, ChevronDown, ChevronRight, Trash2, MoveRight } from "lucide-react";

import { ListWithCards, CardPreview } from "@/types";
import { useCardModal } from "@/hooks/use-card-modal";
import { cn } from "@/lib/utils";
import { getEffectiveDueDate } from "@/lib/due-date";
import { PRIORITY_ORDER, PRIORITY_LABELS, PRIORITY_BADGE_CLASS } from "@/lib/priority";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const LIST_COLORS = ["#6366f1","#8b5cf6","#ec4899","#f43f5e","#f97316","#eab308","#22c55e","#14b8a6","#3b82f6","#06b6d4"];
const getListColor = (title: string): string => {
  let h = 0;
  for (let i = 0; i < title.length; i++) h = title.charCodeAt(i) + ((h << 5) - h);
  return LIST_COLORS[Math.abs(h) % LIST_COLORS.length];
};

type GroupEntry = { card: CardPreview; listName: string; listColor: string };

type ListViewProps = {
  lists: ListWithCards[];
};

type CardRowProps = {
  card: CardPreview;
  listName: string;
  listColor?: string;
  selected: boolean;
  onSelect: (id: string) => void;
};

const CardRow = ({ card, listName, listColor, selected, onSelect }: CardRowProps) => {
  const cardModal = useCardModal();

  const totalItems = card.checklists.reduce((s, c) => s + c.items.length, 0);
  const doneItems = card.checklists.reduce((s, c) => s + c.items.filter((i) => i.completed).length, 0);

  const { date: due, isReview, overdue, dueSoon } = getEffectiveDueDate(card);

  const priorityLabel = PRIORITY_LABELS[card.priority];
  const priorityClassName = PRIORITY_BADGE_CLASS[card.priority];

  return (
    <tr
      className={cn(
        "border-b last:border-0 hover:bg-muted/40 transition-colors cursor-pointer group",
        selected && "bg-primary/10"
      )}
    >
      {/* Checkbox */}
      <td className="py-2 px-3 w-8">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect(card.id)}
          onClick={(e) => e.stopPropagation()}
          className="rounded border-input accent-primary"
        />
      </td>

      {/* Cover dot + Title */}
      <td className="py-2.5 px-2 max-w-[220px]" onClick={() => cardModal.onOpen(card.id)}>
        <div className="flex items-center gap-2">
          {card.coverColor && (
            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: card.coverColor }} />
          )}
          <span className="truncate text-sm font-medium group-hover:text-foreground">{card.title}</span>
          <span className="text-[10px] font-mono text-muted-foreground/50 shrink-0">#{card.cardNumber}</span>
        </div>
      </td>

      {/* List */}
      <td className="py-2.5 px-2">
        <span
          className="text-xs px-2 py-0.5 rounded-full font-medium text-white"
          style={{ backgroundColor: listColor ?? "#6b7280" }}
        >
          {listName}
        </span>
      </td>

      {/* Labels */}
      <td className="py-2.5 px-2">
        <div className="flex flex-wrap gap-1">
          {card.labels.length === 0 ? (
            <span className="text-xs text-muted-foreground">—</span>
          ) : (
            card.labels.map(({ label }) => (
              <span key={label.id} className="inline-block h-2 w-8 rounded-full" style={{ backgroundColor: label.color }} title={label.name} />
            ))
          )}
        </div>
      </td>

      {/* Priority */}
      <td className="py-2.5 px-2">
        {card.priority === "NONE" ? (
          <span className="text-xs text-muted-foreground">—</span>
        ) : (
          <span className={cn("text-xs px-2 py-0.5 rounded font-semibold", priorityClassName)}>
            {priorityLabel}
          </span>
        )}
      </td>

      {/* Due date */}
      <td className="py-2.5 px-2">
        {due ? (
          <span className={cn("inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded",
            card.completed ? "bg-green-500/20 text-green-400" :
            overdue ? "bg-red-500/20 text-red-400" :
            dueSoon ? "bg-yellow-500/20 text-yellow-400" : "text-muted-foreground"
          )}>
            {isReview ? <Eye className="h-3 w-3" /> : <CalendarDays className="h-3 w-3" />}
            {format(due, "MMM d, yyyy")}
            {card.completed && " ✓"}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </td>

      {/* Checklist */}
      <td className="py-2.5 px-2">
        {totalItems > 0 ? (
          <div className="flex items-center gap-1.5">
            <span className={cn("inline-flex items-center gap-1 text-xs", doneItems === totalItems ? "text-green-600" : "text-muted-foreground")}>
              <CheckSquare className="h-3 w-3" /> {doneItems}/{totalItems}
            </span>
            <div className="h-1 w-12 bg-muted rounded-full">
              <div
                className={cn("h-1 rounded-full", doneItems === totalItems ? "bg-green-500" : "bg-primary")}
                style={{ width: `${Math.round((doneItems / totalItems) * 100)}%` }}
              />
            </div>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </td>

      {/* Comments + Attachments */}
      <td className="py-2.5 px-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {card._count.comments > 0 && (
            <span className="flex items-center gap-0.5"><MessageSquare className="h-3 w-3" />{card._count.comments}</span>
          )}
          {card._count.attachments > 0 && (
            <span className="flex items-center gap-0.5"><Paperclip className="h-3 w-3" />{card._count.attachments}</span>
          )}
          {card._count.comments === 0 && card._count.attachments === 0 && "—"}
        </div>
      </td>

      {/* Members */}
      <td className="py-2.5 px-2">
        {card.members.length > 0 ? (
          <div className="flex -space-x-1.5">
            {card.members.slice(0, 4).map((m) => (
              <Avatar key={m.id} className="h-6 w-6 border-2 border-card">
                <AvatarImage src={m.userImage} alt={m.userName} />
                <AvatarFallback className="text-[9px]">{m.userName.charAt(0)}</AvatarFallback>
              </Avatar>
            ))}
            {card.members.length > 4 && (
              <span className="h-6 w-6 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[9px] text-muted-foreground font-medium">
                +{card.members.length - 4}
              </span>
            )}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </td>
    </tr>
  );
};

type GroupSectionProps = {
  label: string;
  color?: string;
  cards: GroupEntry[];
  selectedIds: Set<string>;
  onSelect: (id: string) => void;
};

const GroupSection = ({ label, color, cards, selectedIds, onSelect }: GroupSectionProps) => {
  const [open, setOpen] = useState(true);
  const allSel = cards.length > 0 && cards.every((c) => selectedIds.has(c.card.id));
  return (
    <>
      <tr className="bg-muted/30 border-b">
        <td className="py-1.5 px-3">
          <input type="checkbox" checked={allSel}
            onChange={() => cards.forEach((c) => onSelect(c.card.id))}
            className="rounded border-input accent-primary" />
        </td>
        <td colSpan={8} className="py-1.5 px-2">
          <button
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground transition"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            {color && <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />}
            {label} <span className="font-normal text-muted-foreground/60">({cards.length})</span>
          </button>
        </td>
      </tr>
      {open && cards.map(({ card, listName, listColor }) => (
        <CardRow key={card.id} card={card} listName={listName} listColor={listColor} selected={selectedIds.has(card.id)} onSelect={onSelect} />
      ))}
    </>
  );
};

export const ListView = ({ lists }: ListViewProps) => {
  const [groupBy, setGroupBy] = useState<"list" | "priority" | "assignee">("list");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const allCards = useMemo<GroupEntry[]>(
    () => lists.flatMap((list) => list.cards.map((card) => ({ card, listName: list.title, listColor: getListColor(list.title) }))),
    [lists]
  );

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const groups = useMemo(() => {
    if (groupBy === "list") {
      return lists
        .map((l) => ({ label: l.title, color: getListColor(l.title) as string | undefined, cards: allCards.filter((c) => c.listName === l.title) }))
        .filter((g) => g.cards.length > 0);
    }
    if (groupBy === "priority") {
      return PRIORITY_ORDER
        .map((p) => ({ label: PRIORITY_LABELS[p], color: undefined as string | undefined, cards: allCards.filter((c) => c.card.priority === p) }))
        .filter((g) => g.cards.length > 0);
    }
    const map = new Map<string, { name: string; cards: GroupEntry[] }>();
    allCards.forEach((row) => {
      if (row.card.members.length === 0) {
        if (!map.has("__none")) map.set("__none", { name: "Unassigned", cards: [] });
        map.get("__none")!.cards.push(row);
      } else {
        row.card.members.forEach((m) => {
          if (!map.has(m.userId)) map.set(m.userId, { name: m.userName, cards: [] });
          map.get(m.userId)!.cards.push(row);
        });
      }
    });
    return Array.from(map.values()).map((v) => ({ label: v.name, color: undefined as string | undefined, cards: v.cards }));
  }, [groupBy, allCards, lists]);

  if (allCards.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
        No cards yet. Switch to Board view to add cards.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground font-medium">Group by:</span>
        {(["list", "priority", "assignee"] as const).map((g) => (
          <button key={g} onClick={() => setGroupBy(g)}
            className={cn("text-xs px-3 py-1 rounded-full border transition",
              groupBy === g ? "bg-primary text-primary-foreground border-primary" : "bg-secondary text-muted-foreground border-border hover:border-muted-foreground"
            )}>
            {g === "list" ? "List" : g === "priority" ? "Priority" : "Assignee"}
          </button>
        ))}
        {selectedIds.size > 0 && <span className="ml-2 text-xs text-primary font-medium">{selectedIds.size} selected</span>}
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="py-2.5 px-3 w-8">
                <input type="checkbox"
                  onChange={(e) => setSelectedIds(e.target.checked ? new Set(allCards.map((c) => c.card.id)) : new Set())}
                  checked={selectedIds.size === allCards.length && allCards.length > 0}
                  className="rounded border-input accent-primary" />
              </th>
              {["Title","List","Labels","Priority","Due Date","Checklist","Activity","Members"].map((h) => (
                <th key={h} className="text-left py-2.5 px-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <GroupSection key={group.label} label={group.label} color={group.color} cards={group.cards} selectedIds={selectedIds} onSelect={toggleSelect} />
            ))}
          </tbody>
        </table>
      </div>

      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-card border border-border text-card-foreground px-4 py-2.5 rounded-lg shadow-2xl">
          <span className="text-sm font-medium">{selectedIds.size} card{selectedIds.size > 1 ? "s" : ""} selected</span>
          <div className="w-px h-4 bg-border mx-1" />
          <Button size="sm" variant="ghost" className="h-7 text-xs text-red-400 hover:bg-muted gap-1" onClick={() => setSelectedIds(new Set())}>
            <Trash2 className="h-3.5 w-3.5" /> Clear selection
          </Button>
          <button onClick={() => setSelectedIds(new Set())} className="text-xs text-muted-foreground hover:text-foreground ml-1">x</button>
        </div>
      )}
    </div>
  );
};
