"use client";

import { format } from "date-fns";
import { CalendarDays, CheckSquare, MessageSquare, Paperclip } from "lucide-react";

import { ListWithCards, CardPreview } from "@/types";
import { useCardModal } from "@/hooks/use-card-modal";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const PRIORITY_BADGE: Record<string, { label: string; className: string }> = {
  NONE: { label: "—", className: "text-muted-foreground" },
  LOW: { label: "Low", className: "bg-blue-100 text-blue-700" },
  MEDIUM: { label: "Medium", className: "bg-yellow-100 text-yellow-700" },
  HIGH: { label: "High", className: "bg-orange-100 text-orange-700" },
  URGENT: { label: "Urgent", className: "bg-red-100 text-red-700" },
};

type ListViewProps = {
  lists: ListWithCards[];
};

type CardRowProps = {
  card: CardPreview;
  listName: string;
  listColor?: string;
};

const CardRow = ({ card, listName, listColor }: CardRowProps) => {
  const cardModal = useCardModal();

  const totalItems = card.checklists.reduce((s, c) => s + c.items.length, 0);
  const doneItems = card.checklists.reduce((s, c) => s + c.items.filter((i) => i.completed).length, 0);

  const due = card.dueDate ? new Date(card.dueDate) : null;
  const now = new Date();
  const overdue = due && !card.completed && due < now;
  const dueSoon =
    due &&
    !card.completed &&
    due > now &&
    due.getTime() - now.getTime() < 86400000 * 2;

  const priorityCfg = PRIORITY_BADGE[card.priority];

  return (
    <tr
      role="button"
      onClick={() => cardModal.onOpen(card.id)}
      className="border-b last:border-0 hover:bg-muted/50 transition-colors cursor-pointer group"
    >
      {/* Cover dot + Title */}
      <td className="py-2.5 px-3 max-w-[260px]">
        <div className="flex items-center gap-2">
          {card.coverColor && (
            <span
              className="h-3 w-3 rounded-full shrink-0"
              style={{ backgroundColor: card.coverColor }}
            />
          )}
          <span className="truncate text-sm font-medium group-hover:text-black">
            {card.title}
          </span>
        </div>
      </td>

      {/* List */}
      <td className="py-2.5 px-3">
        <span
          className="text-xs px-2 py-0.5 rounded-full font-medium text-white"
          style={{ backgroundColor: listColor ?? "#6b7280" }}
        >
          {listName}
        </span>
      </td>

      {/* Labels */}
      <td className="py-2.5 px-3">
        <div className="flex flex-wrap gap-1">
          {card.labels.length === 0 ? (
            <span className="text-xs text-muted-foreground">—</span>
          ) : (
            card.labels.map(({ label }) => (
              <span
                key={label.id}
                className="inline-block h-2 w-8 rounded-full"
                style={{ backgroundColor: label.color }}
                title={label.name}
              />
            ))
          )}
        </div>
      </td>

      {/* Priority */}
      <td className="py-2.5 px-3">
        {card.priority === "NONE" ? (
          <span className="text-xs text-muted-foreground">—</span>
        ) : (
          <span
            className={cn(
              "text-xs px-2 py-0.5 rounded font-semibold",
              priorityCfg.className
            )}
          >
            {priorityCfg.label}
          </span>
        )}
      </td>

      {/* Due date */}
      <td className="py-2.5 px-3">
        {due ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded",
              card.completed
                ? "bg-green-100 text-green-700"
                : overdue
                ? "bg-red-100 text-red-600"
                : dueSoon
                ? "bg-yellow-100 text-yellow-700"
                : "text-muted-foreground"
            )}
          >
            <CalendarDays className="h-3 w-3" />
            {format(due, "MMM d, yyyy")}
            {card.completed && " ✓"}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </td>

      {/* Checklist */}
      <td className="py-2.5 px-3">
        {totalItems > 0 ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-xs",
              doneItems === totalItems ? "text-green-600" : "text-muted-foreground"
            )}
          >
            <CheckSquare className="h-3 w-3" />
            {doneItems}/{totalItems}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </td>

      {/* Comments + Attachments */}
      <td className="py-2.5 px-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {card._count.comments > 0 && (
            <span className="flex items-center gap-0.5">
              <MessageSquare className="h-3 w-3" />
              {card._count.comments}
            </span>
          )}
          {card._count.attachments > 0 && (
            <span className="flex items-center gap-0.5">
              <Paperclip className="h-3 w-3" />
              {card._count.attachments}
            </span>
          )}
          {card._count.comments === 0 && card._count.attachments === 0 && "—"}
        </div>
      </td>

      {/* Members */}
      <td className="py-2.5 px-3">
        {card.members.length > 0 ? (
          <div className="flex -space-x-1.5">
            {card.members.slice(0, 4).map((m) => (
              <Avatar key={m.id} className="h-6 w-6 border-2 border-white">
                <AvatarImage src={m.userImage} alt={m.userName} />
                <AvatarFallback className="text-[9px]">
                  {m.userName.charAt(0)}
                </AvatarFallback>
              </Avatar>
            ))}
            {card.members.length > 4 && (
              <span className="h-6 w-6 rounded-full bg-muted border-2 border-white flex items-center justify-center text-[9px] text-muted-foreground font-medium">
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

// Generate a deterministic color from list title for the list badge
const listColors = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e",
  "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#3b82f6", "#06b6d4",
];
const getListColor = (title: string) => {
  let hash = 0;
  for (let i = 0; i < title.length; i++) hash = title.charCodeAt(i) + ((hash << 5) - hash);
  return listColors[Math.abs(hash) % listColors.length];
};

export const ListView = ({ lists }: ListViewProps) => {
  const allCards = lists.flatMap((list) =>
    list.cards.map((card) => ({ card, listName: list.title, listColor: getListColor(list.title) }))
  );

  if (allCards.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
        No cards yet. Switch to Board view to add cards.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left py-2.5 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">
              Title
            </th>
            <th className="text-left py-2.5 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">
              List
            </th>
            <th className="text-left py-2.5 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">
              Labels
            </th>
            <th className="text-left py-2.5 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">
              Priority
            </th>
            <th className="text-left py-2.5 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">
              Due Date
            </th>
            <th className="text-left py-2.5 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">
              Checklist
            </th>
            <th className="text-left py-2.5 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">
              Activity
            </th>
            <th className="text-left py-2.5 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">
              Members
            </th>
          </tr>
        </thead>
        <tbody>
          {allCards.map(({ card, listName, listColor }) => (
            <CardRow
              key={card.id}
              card={card}
              listName={listName}
              listColor={listColor}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};
