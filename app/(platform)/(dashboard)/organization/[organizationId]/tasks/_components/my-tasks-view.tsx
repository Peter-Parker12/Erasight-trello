"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import {
  CalendarDays,
  CheckSquare,
  MessageSquare,
  Paperclip,
  ChevronDown,
  ChevronRight,
  Trash2,
} from "lucide-react";

import { TaskCard, SubtaskWithList, BoardListOption } from "@/types";
import { useCardModal } from "@/hooks/use-card-modal";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getListColor } from "./list-color";
import { StatusSelect } from "./status-select";

const PRIORITY_BADGE: Record<string, { label: string; className: string }> = {
  NONE:   { label: "—",      className: "text-muted-foreground" },
  LOW:    { label: "Low",    className: "bg-blue-100 text-blue-700" },
  MEDIUM: { label: "Medium", className: "bg-yellow-100 text-yellow-700" },
  HIGH:   { label: "High",   className: "bg-orange-100 text-orange-700" },
  URGENT: { label: "Urgent", className: "bg-red-100 text-red-700" },
};
const PRIORITY_ORDER = ["URGENT", "HIGH", "MEDIUM", "LOW", "NONE"];

type GroupEntry = {
  card: TaskCard;
  listName: string;
  listColor: string;
  boardTitle: string;
};

type CardRowProps = {
  entry: GroupEntry;
  selected: boolean;
  onSelect: (id: string) => void;
  expanded: boolean;
  onToggleExpand: (id: string) => void;
};

const CardRow = ({ entry, selected, onSelect, expanded, onToggleExpand }: CardRowProps) => {
  const { card, boardTitle } = entry;
  const cardModal = useCardModal();

  const totalItems = card.checklists.reduce((s, c) => s + c.items.length, 0);
  const doneItems = card.checklists.reduce((s, c) => s + c.items.filter((i) => i.completed).length, 0);

  const due = card.dueDate ? new Date(card.dueDate) : null;
  const now = new Date();
  const overdue = due && !card.completed && due < now;
  const dueSoon = due && !card.completed && due > now && due.getTime() - now.getTime() < 86400000 * 2;

  const priorityCfg = PRIORITY_BADGE[card.priority];
  const hasSubtasks = card.subtasks.length > 0;

  return (
    <tr className={cn("border-b last:border-0 hover:bg-muted/40 transition-colors cursor-pointer group", selected && "bg-sky-50")}>
      {/* Checkbox */}
      <td className="py-2 px-3 w-8">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect(card.id)}
          onClick={(e) => e.stopPropagation()}
          className="rounded border-gray-300 text-sky-600 focus:ring-sky-500"
        />
      </td>

      {/* Title */}
      <td className="py-2.5 px-2 max-w-[200px]">
        <div className="flex items-center gap-1.5">
          {hasSubtasks ? (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleExpand(card.id); }}
              className="text-muted-foreground hover:text-foreground shrink-0 p-0.5 -ml-0.5"
            >
              {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </button>
          ) : (
            <span className="w-3.5 shrink-0" />
          )}
          <div className="flex items-center gap-2 min-w-0" onClick={() => cardModal.onOpen(card.id)}>
            {card.coverColor && (
              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: card.coverColor }} />
            )}
            <span className="truncate text-sm font-medium group-hover:text-black">{card.title}</span>
            <span className="text-[10px] font-mono text-muted-foreground/50 shrink-0">#{card.cardNumber}</span>
            {hasSubtasks && (
              <span className="text-[10px] text-muted-foreground shrink-0">
                {card.subtasks.filter((s) => s.completed).length}/{card.subtasks.length}
              </span>
            )}
          </div>
        </div>
      </td>

      {/* Project */}
      <td className="py-2.5 px-2 max-w-[160px]" onClick={() => cardModal.onOpen(card.id)}>
        <span className="truncate text-xs font-medium text-muted-foreground">{boardTitle}</span>
      </td>

      {/* Status */}
      <td className="py-2.5 px-2">
        <StatusSelect
          cardId={card.id}
          boardId={card.list.board.id}
          currentListId={card.list.id}
          lists={card.list.board.lists}
        />
      </td>

      {/* Labels */}
      <td className="py-2.5 px-2" onClick={() => cardModal.onOpen(card.id)}>
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
      <td className="py-2.5 px-2" onClick={() => cardModal.onOpen(card.id)}>
        {card.priority === "NONE" ? (
          <span className="text-xs text-muted-foreground">—</span>
        ) : (
          <span className={cn("text-xs px-2 py-0.5 rounded font-semibold", priorityCfg.className)}>
            {priorityCfg.label}
          </span>
        )}
      </td>

      {/* Due date */}
      <td className="py-2.5 px-2" onClick={() => cardModal.onOpen(card.id)}>
        {due ? (
          <span className={cn("inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded",
            card.completed ? "bg-green-100 text-green-700" :
            overdue ? "bg-red-100 text-red-600" :
            dueSoon ? "bg-yellow-100 text-yellow-700" : "text-muted-foreground"
          )}>
            <CalendarDays className="h-3 w-3" />
            {format(due, "MMM d, yyyy")}
            {card.completed && " ✓"}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </td>

      {/* Checklist */}
      <td className="py-2.5 px-2" onClick={() => cardModal.onOpen(card.id)}>
        {totalItems > 0 ? (
          <div className="flex items-center gap-1.5">
            <span className={cn("inline-flex items-center gap-1 text-xs", doneItems === totalItems ? "text-green-600" : "text-muted-foreground")}>
              <CheckSquare className="h-3 w-3" /> {doneItems}/{totalItems}
            </span>
            <div className="h-1 w-12 bg-gray-200 rounded-full">
              <div
                className={cn("h-1 rounded-full", doneItems === totalItems ? "bg-green-500" : "bg-sky-500")}
                style={{ width: `${Math.round((doneItems / totalItems) * 100)}%` }}
              />
            </div>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </td>

      {/* Activity */}
      <td className="py-2.5 px-2" onClick={() => cardModal.onOpen(card.id)}>
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
      <td className="py-2.5 px-2" onClick={() => cardModal.onOpen(card.id)}>
        {card.members.length > 0 ? (
          <div className="flex -space-x-1.5">
            {card.members.slice(0, 4).map((m) => (
              <Avatar key={m.id} className="h-6 w-6 border-2 border-white">
                <AvatarImage src={m.userImage} alt={m.userName} />
                <AvatarFallback className="text-[9px]">{m.userName.charAt(0)}</AvatarFallback>
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

type SubtaskRowProps = {
  subtask: SubtaskWithList;
  boardId: string;
  boardLists: BoardListOption[];
};

const SubtaskRow = ({ subtask, boardId, boardLists }: SubtaskRowProps) => {
  const cardModal = useCardModal();

  const due = subtask.dueDate ? new Date(subtask.dueDate) : null;
  const now = new Date();
  const overdue = due && !subtask.completed && due < now;
  const dueSoon = due && !subtask.completed && due > now && due.getTime() - now.getTime() < 86400000 * 2;
  const priorityCfg = PRIORITY_BADGE[subtask.priority];

  return (
    <tr className="border-b last:border-0 hover:bg-muted/20 transition-colors group bg-muted/5">
      {/* Checkbox (subtasks aren't bulk-selectable) */}
      <td className="py-2 px-3 w-8" />

      {/* Title */}
      <td className="py-2 px-2 max-w-[200px] pl-9" onClick={() => cardModal.onOpen(subtask.id)}>
        <div className="flex items-center gap-2 cursor-pointer min-w-0">
          <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", subtask.completed ? "bg-green-400" : "bg-gray-300")} />
          <span className={cn("truncate text-xs font-medium group-hover:text-black", subtask.completed && "line-through text-muted-foreground")}>
            {subtask.title}
          </span>
          <span className="text-[10px] font-mono text-muted-foreground/50 shrink-0">#{subtask.cardNumber}</span>
        </div>
      </td>

      {/* Project */}
      <td className="py-2 px-2"><span className="text-xs text-muted-foreground">—</span></td>

      {/* Status */}
      <td className="py-2 px-2">
        <StatusSelect cardId={subtask.id} boardId={boardId} currentListId={subtask.list.id} lists={boardLists} />
      </td>

      {/* Labels */}
      <td className="py-2 px-2"><span className="text-xs text-muted-foreground">—</span></td>

      {/* Priority */}
      <td className="py-2 px-2">
        {subtask.priority === "NONE" ? (
          <span className="text-xs text-muted-foreground">—</span>
        ) : (
          <span className={cn("text-xs px-2 py-0.5 rounded font-semibold", priorityCfg.className)}>
            {priorityCfg.label}
          </span>
        )}
      </td>

      {/* Due date */}
      <td className="py-2 px-2">
        {due ? (
          <span className={cn("inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded",
            subtask.completed ? "bg-green-100 text-green-700" :
            overdue ? "bg-red-100 text-red-600" :
            dueSoon ? "bg-yellow-100 text-yellow-700" : "text-muted-foreground"
          )}>
            <CalendarDays className="h-3 w-3" />
            {format(due, "MMM d, yyyy")}
            {subtask.completed && " ✓"}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </td>

      {/* Checklist */}
      <td className="py-2 px-2"><span className="text-xs text-muted-foreground">—</span></td>

      {/* Activity */}
      <td className="py-2 px-2"><span className="text-xs text-muted-foreground">—</span></td>

      {/* Members */}
      <td className="py-2 px-2">
        {subtask.members.length > 0 ? (
          <div className="flex -space-x-1.5">
            {subtask.members.slice(0, 4).map((m) => (
              <Avatar key={m.id} className="h-5 w-5 border-2 border-white">
                <AvatarImage src={m.userImage} alt={m.userName} />
                <AvatarFallback className="text-[8px]">{m.userName.charAt(0)}</AvatarFallback>
              </Avatar>
            ))}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </td>
    </tr>
  );
};

type TaskRowGroupProps = {
  entry: GroupEntry;
  selected: boolean;
  onSelect: (id: string) => void;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
};

const TaskRowGroup = ({ entry, selected, onSelect, expandedIds, onToggleExpand }: TaskRowGroupProps) => {
  const { card } = entry;
  const expanded = expandedIds.has(card.id);

  return (
    <>
      <CardRow entry={entry} selected={selected} onSelect={onSelect} expanded={expanded} onToggleExpand={onToggleExpand} />
      {expanded && card.subtasks.map((subtask) => (
        <SubtaskRow key={subtask.id} subtask={subtask} boardId={card.list.board.id} boardLists={card.list.board.lists} />
      ))}
    </>
  );
};

type GroupSectionProps = {
  label: string;
  color?: string;
  entries: GroupEntry[];
  selectedIds: Set<string>;
  onSelect: (id: string) => void;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
};

const GroupSection = ({ label, color, entries, selectedIds, onSelect, expandedIds, onToggleExpand }: GroupSectionProps) => {
  const [open, setOpen] = useState(true);
  const allSel = entries.length > 0 && entries.every((e) => selectedIds.has(e.card.id));
  return (
    <>
      <tr className="bg-muted/30 border-b">
        <td className="py-1.5 px-3">
          <input
            type="checkbox"
            checked={allSel}
            onChange={() => entries.forEach((e) => onSelect(e.card.id))}
            className="rounded border-gray-300 text-sky-600"
          />
        </td>
        <td colSpan={9} className="py-1.5 px-2">
          <button
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground transition"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            {color && <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />}
            {label} <span className="font-normal text-muted-foreground/60">({entries.length})</span>
          </button>
        </td>
      </tr>
      {open && entries.map((entry) => (
        <TaskRowGroup key={entry.card.id} entry={entry} selected={selectedIds.has(entry.card.id)} onSelect={onSelect} expandedIds={expandedIds} onToggleExpand={onToggleExpand} />
      ))}
    </>
  );
};

type ListGroup = { key: string; name: string; color: string; entries: GroupEntry[] };
type ProjectGroup = { key: string; title: string; color: string; lists: ListGroup[] };

type ListSubSectionProps = {
  list: ListGroup;
  selectedIds: Set<string>;
  onSelect: (id: string) => void;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
};

const ListSubSection = ({ list, selectedIds, onSelect, expandedIds, onToggleExpand }: ListSubSectionProps) => {
  const [open, setOpen] = useState(true);
  const allSel = list.entries.length > 0 && list.entries.every((e) => selectedIds.has(e.card.id));
  return (
    <>
      <tr className="bg-muted/20 border-b">
        <td className="py-1.5 px-3">
          <input
            type="checkbox"
            checked={allSel}
            onChange={() => list.entries.forEach((e) => onSelect(e.card.id))}
            className="rounded border-gray-300 text-sky-600"
          />
        </td>
        <td colSpan={9} className="py-1 px-2 pl-8">
          <button
            className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: list.color }} />
            {list.name}
            <span className="font-normal text-muted-foreground/50">({list.entries.length})</span>
          </button>
        </td>
      </tr>
      {open && list.entries.map((entry) => (
        <TaskRowGroup key={entry.card.id} entry={entry} selected={selectedIds.has(entry.card.id)} onSelect={onSelect} expandedIds={expandedIds} onToggleExpand={onToggleExpand} />
      ))}
    </>
  );
};

type ProjectListSectionProps = {
  project: ProjectGroup;
  selectedIds: Set<string>;
  onSelect: (id: string) => void;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
};

const ProjectListSection = ({ project, selectedIds, onSelect, expandedIds, onToggleExpand }: ProjectListSectionProps) => {
  const [open, setOpen] = useState(true);
  const allEntries = project.lists.flatMap((l) => l.entries);
  const totalCount = allEntries.length;
  const allSel = totalCount > 0 && allEntries.every((e) => selectedIds.has(e.card.id));
  return (
    <>
      <tr className="bg-muted/50 border-b">
        <td className="py-2 px-3">
          <input
            type="checkbox"
            checked={allSel}
            onChange={() => allEntries.forEach((e) => onSelect(e.card.id))}
            className="rounded border-gray-300 text-sky-600"
          />
        </td>
        <td colSpan={9} className="py-2 px-2">
          <button
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-foreground/70 hover:text-foreground transition"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: project.color }} />
            {project.title}
            <span className="font-normal text-muted-foreground/60">({totalCount})</span>
          </button>
        </td>
      </tr>
      {open && project.lists.map((list) => (
        <ListSubSection key={list.key} list={list} selectedIds={selectedIds} onSelect={onSelect} expandedIds={expandedIds} onToggleExpand={onToggleExpand} />
      ))}
    </>
  );
};

type MyTasksViewProps = {
  cards: TaskCard[];
  isAdmin: boolean;
};

export const MyTasksView = ({ cards, isAdmin }: MyTasksViewProps) => {
  const [groupBy, setGroupBy] = useState<"project" | "list" | "priority" | "assignee">("project");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const allEntries = useMemo<GroupEntry[]>(
    () => cards.map((card) => ({
      card,
      listName: card.list.title,
      listColor: getListColor(card.list.title),
      boardTitle: card.list.board.title,
    })),
    [cards]
  );

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const toggleExpand = (id: string) =>
    setExpandedIds((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  // Two-level grouping used only for "list" mode: project → lists → cards
  const listGroups = useMemo<ProjectGroup[] | null>(() => {
    if (groupBy !== "list") return null;
    const boardMap = new Map<string, { title: string; color: string; lists: Map<string, { name: string; color: string; entries: GroupEntry[] }> }>();
    allEntries.forEach((e) => {
      const boardId = e.card.list.board.id;
      if (!boardMap.has(boardId)) {
        boardMap.set(boardId, { title: e.boardTitle, color: getListColor(e.boardTitle), lists: new Map() });
      }
      const board = boardMap.get(boardId)!;
      const listId = e.card.list.id;
      if (!board.lists.has(listId)) {
        board.lists.set(listId, { name: e.listName, color: e.listColor, entries: [] });
      }
      board.lists.get(listId)!.entries.push(e);
    });
    return Array.from(boardMap.entries()).map(([boardId, board]) => ({
      key: boardId,
      title: board.title,
      color: board.color,
      lists: Array.from(board.lists.entries()).map(([listId, list]) => ({
        key: listId,
        name: list.name,
        color: list.color,
        entries: list.entries,
      })),
    }));
  }, [groupBy, allEntries]);

  const groups = useMemo(() => {
    if (groupBy === "project") {
      const map = new Map<string, { title: string; entries: GroupEntry[] }>();
      allEntries.forEach((e) => {
        const id = e.card.list.board.id;
        if (!map.has(id)) map.set(id, { title: e.boardTitle, entries: [] });
        map.get(id)!.entries.push(e);
      });
      return Array.from(map.entries()).map(([id, v]) => ({
        key: id,
        label: v.title,
        color: getListColor(v.title) as string | undefined,
        entries: v.entries,
      }));
    }
    if (groupBy === "priority") {
      return PRIORITY_ORDER
        .map((p) => ({
          key: p,
          label: PRIORITY_BADGE[p].label,
          color: undefined as string | undefined,
          entries: allEntries.filter((e) => e.card.priority === p),
        }))
        .filter((g) => g.entries.length > 0);
    }
    // assignee
    const map = new Map<string, { name: string; entries: GroupEntry[] }>();
    allEntries.forEach((e) => {
      if (e.card.members.length === 0) {
        if (!map.has("__none")) map.set("__none", { name: "Unassigned", entries: [] });
        map.get("__none")!.entries.push(e);
      } else {
        e.card.members.forEach((m) => {
          if (!map.has(m.userId)) map.set(m.userId, { name: m.userName, entries: [] });
          map.get(m.userId)!.entries.push(e);
        });
      }
    });
    return Array.from(map.entries()).map(([id, v]) => ({
      key: id,
      label: v.name,
      color: undefined as string | undefined,
      entries: v.entries,
    }));
  }, [groupBy, allEntries]);

  if (allEntries.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
        {isAdmin ? "No tasks found across all projects." : "No tasks assigned to you yet."}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground font-medium">Group by:</span>
        {(["project", "list", "priority", "assignee"] as const).map((g) => (
          <button
            key={g}
            onClick={() => setGroupBy(g)}
            className={cn(
              "text-xs px-3 py-1 rounded-full border transition capitalize",
              groupBy === g ? "bg-gray-900 text-white border-gray-900" : "bg-white text-muted-foreground border-gray-200 hover:border-gray-400"
            )}
          >
            {g === "project" ? "Project" : g === "list" ? "List" : g === "priority" ? "Priority" : "Assignee"}
          </button>
        ))}
        {selectedIds.size > 0 && (
          <span className="ml-2 text-xs text-sky-600 font-medium">{selectedIds.size} selected</span>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="py-2.5 px-3 w-8">
                <input
                  type="checkbox"
                  onChange={(e) => setSelectedIds(e.target.checked ? new Set(allEntries.map((e) => e.card.id)) : new Set())}
                  checked={selectedIds.size === allEntries.length && allEntries.length > 0}
                  className="rounded border-gray-300 text-sky-600"
                />
              </th>
              {["Title", "Project", "Status", "Labels", "Priority", "Due Date", "Checklist", "Activity", "Members"].map((h) => (
                <th key={h} className="text-left py-2.5 px-2 font-medium text-muted-foreground text-xs uppercase tracking-wide whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {listGroups
              ? listGroups.map((project) => (
                  <ProjectListSection
                    key={project.key}
                    project={project}
                    selectedIds={selectedIds}
                    onSelect={toggleSelect}
                    expandedIds={expandedIds}
                    onToggleExpand={toggleExpand}
                  />
                ))
              : groups.map((group) => (
                  <GroupSection
                    key={group.key}
                    label={group.label}
                    color={group.color}
                    entries={group.entries}
                    selectedIds={selectedIds}
                    onSelect={toggleSelect}
                    expandedIds={expandedIds}
                    onToggleExpand={toggleExpand}
                  />
                ))}
          </tbody>
        </table>
      </div>

      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-xl shadow-2xl">
          <span className="text-sm font-medium">{selectedIds.size} card{selectedIds.size > 1 ? "s" : ""} selected</span>
          <div className="w-px h-4 bg-white/20 mx-1" />
          <Button size="sm" variant="ghost" className="h-7 text-xs text-red-400 hover:bg-white/10 gap-1" onClick={() => setSelectedIds(new Set())}>
            <Trash2 className="h-3.5 w-3.5" /> Clear selection
          </Button>
          <button onClick={() => setSelectedIds(new Set())} className="text-xs text-white/50 hover:text-white ml-1">x</button>
        </div>
      )}
    </div>
  );
};
