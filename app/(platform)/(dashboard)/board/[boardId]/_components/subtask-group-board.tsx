"use client";

import { CSSProperties, useState } from "react";
import { toast } from "sonner";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";

import { ListWithCards, CardPreview, SubtaskPreview } from "@/types";
import { useCardModal } from "@/hooks/use-card-modal";
import { useAction } from "@/hooks/use-action";
import { updateCardOrder } from "@/actions/update-card-order";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const PRIORITY_DOT: Record<string, string> = {
  NONE: "bg-gray-300",
  LOW: "bg-blue-400",
  MEDIUM: "bg-yellow-400",
  HIGH: "bg-orange-400",
  URGENT: "bg-red-500",
};

const LIST_TYPE_BADGE: Record<string, string> = {
  STANDARD: "bg-gray-200 text-gray-700",
  DONE: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-200 text-gray-500",
};

const CELL_SEP = "::";

function reorder<T>(list: T[], startIndex: number, endIndex: number) {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
}

function sortSubtasks(subtasks: SubtaskPreview[]) {
  return [...subtasks].sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}

type SubtaskGroupBoardProps = {
  lists: ListWithCards[];
  parents: CardPreview[];
  boardId: string;
};

export const SubtaskGroupBoard = ({ lists, parents, boardId }: SubtaskGroupBoardProps) => {
  const cardModal = useCardModal();

  const [orderedParents, setOrderedParents] = useState(parents);
  const [prevParents, setPrevParents] = useState(parents);

  if (parents !== prevParents) {
    setPrevParents(parents);
    setOrderedParents(parents);
  }

  const { execute: executeUpdateCardOrder } = useAction(updateCardOrder, {
    onError: (error) => toast.error(error),
  });

  const listsById = new Map(lists.map((l) => [l.id, l]));

  const columnCounts = new Map<string, number>();
  lists.forEach((l) => columnCounts.set(l.id, l.cards.filter((c) => c.subtasks.length === 0).length));
  orderedParents.forEach((p) => {
    p.subtasks.forEach((s) => {
      columnCounts.set(s.list.id, (columnCounts.get(s.list.id) ?? 0) + 1);
    });
  });

  if (orderedParents.length === 0) return null;

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const [sourceParentId, sourceListId] = source.droppableId.split(CELL_SEP);
    const [destParentId, destListId] = destination.droppableId.split(CELL_SEP);

    if (sourceParentId !== destParentId) {
      toast.error("Subtasks can only be moved within the same task");
      return;
    }

    const parentIndex = orderedParents.findIndex((p) => p.id === sourceParentId);
    if (parentIndex === -1) return;

    const parent = orderedParents[parentIndex];
    const destList = listsById.get(destListId);
    if (!destList) return;

    const cellOf = (listId: string) => sortSubtasks(parent.subtasks.filter((s) => s.list.id === listId));

    let updatedSubtasks: SubtaskPreview[];
    let changed: SubtaskPreview[];

    if (sourceListId === destListId) {
      const cell = cellOf(sourceListId);
      const reordered = reorder(cell, source.index, destination.index).map((s, i) => ({ ...s, order: i }));
      changed = reordered;

      const others = parent.subtasks.filter((s) => s.list.id !== sourceListId);
      updatedSubtasks = [...others, ...reordered];
    } else {
      const sourceCell = cellOf(sourceListId);
      const destCell = cellOf(destListId);

      const [moved] = sourceCell.splice(source.index, 1);
      const movedUpdated: SubtaskPreview = {
        ...moved,
        listId: destListId,
        list: { id: destList.id, title: destList.title, type: destList.type },
      };
      destCell.splice(destination.index, 0, movedUpdated);

      const newSourceCell = sourceCell.map((s, i) => ({ ...s, order: i }));
      const newDestCell = destCell.map((s, i) => ({ ...s, order: i }));
      changed = [...newSourceCell, ...newDestCell];

      const others = parent.subtasks.filter((s) => s.list.id !== sourceListId && s.list.id !== destListId);
      updatedSubtasks = [...others, ...newSourceCell, ...newDestCell];
    }

    const newParents = [...orderedParents];
    newParents[parentIndex] = { ...parent, subtasks: updatedSubtasks };
    setOrderedParents(newParents);

    executeUpdateCardOrder({
      boardId,
      items: changed.map((s) => ({
        id: s.id,
        title: s.title,
        order: s.order,
        listId: s.listId,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
    });
  };

  return (
    <div className="px-2 sm:px-4 pt-3">
      <div className="overflow-x-auto rounded-md bg-[#f2f2f4]/60 border border-black/5">
        <DragDropContext onDragEnd={onDragEnd}>
          <table className="border-collapse w-full">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-[#f2f2f4] text-left text-xs font-semibold text-muted-foreground px-3 py-2 w-[260px] min-w-[260px]">
                  Tasks
                </th>
                {lists.map((list) => (
                  <th
                    key={list.id}
                    className="text-left text-xs font-semibold text-muted-foreground px-2 py-2 w-[272px] min-w-[272px]"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      {list.title}
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-gray-200 text-gray-600 font-semibold">
                        {columnCounts.get(list.id) ?? 0}
                      </span>
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orderedParents.map((parent) => (
                <ParentRow
                  key={parent.id}
                  parent={parent}
                  lists={lists}
                  ownList={listsById.get(parent.listId)}
                  onOpen={() => cardModal.onOpen(parent.id)}
                />
              ))}
            </tbody>
          </table>
        </DragDropContext>
      </div>
    </div>
  );
};

type ParentRowProps = {
  parent: CardPreview;
  lists: ListWithCards[];
  ownList?: ListWithCards;
  onOpen: () => void;
};

const ParentRow = ({ parent, lists, ownList, onOpen }: ParentRowProps) => {
  const totalSubtasks = parent.subtasks.length;
  const doneSubtasks = parent.subtasks.filter((s) => s.completed).length;
  const priorityDot = PRIORITY_DOT[parent.priority];

  return (
    <tr className="border-t border-black/5 align-top">
      <td className="sticky left-0 z-10 bg-[#f2f2f4] px-3 py-2 w-[260px] min-w-[260px] align-top">
        <div role="button" onClick={onOpen} className="cursor-pointer group">
          <div className="flex items-center gap-1.5 mb-1">
            {ownList && (
              <span
                className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wide",
                  LIST_TYPE_BADGE[ownList.type] ?? LIST_TYPE_BADGE.STANDARD
                )}
              >
                {ownList.title}
              </span>
            )}
            <span
              className={cn(
                "ml-auto px-1.5 py-0.5 rounded-full text-[10px] font-semibold",
                doneSubtasks === totalSubtasks ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"
              )}
            >
              {doneSubtasks}/{totalSubtasks}
            </span>
          </div>
          <div className="flex items-start gap-1.5">
            {priorityDot && <span className={cn("mt-1 h-2 w-2 rounded-full shrink-0", priorityDot)} />}
            <p className="text-sm font-medium truncate group-hover:underline">{parent.title}</p>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[10px] font-mono text-muted-foreground/60">#{parent.cardNumber}</span>
            {parent.members.length > 0 && (
              <div className="flex -space-x-1">
                {parent.members.slice(0, 3).map((m) => (
                  <Avatar key={m.id} className="h-5 w-5 border border-white">
                    <AvatarImage src={m.userImage} alt={m.userName} />
                    <AvatarFallback className="text-[9px]">{m.userName.charAt(0)}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
            )}
          </div>
        </div>
      </td>

      {lists.map((list) => (
        <td key={list.id} className="px-2 py-2 w-[272px] min-w-[272px] align-top">
          <Droppable droppableId={`${parent.id}${CELL_SEP}${list.id}`}>
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="flex flex-col gap-2 min-h-[44px]"
              >
                {sortSubtasks(parent.subtasks.filter((s) => s.list.id === list.id)).map((sub, i) => (
                  <SubtaskCellCard key={sub.id} sub={sub} index={i} />
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </td>
      ))}
    </tr>
  );
};

type SubtaskCellCardProps = {
  sub: SubtaskPreview;
  index: number;
};

const SubtaskCellCard = ({ sub, index }: SubtaskCellCardProps) => {
  const cardModal = useCardModal();
  const dotColor = sub.completed ? "bg-green-400" : PRIORITY_DOT[sub.priority] ?? "bg-gray-300";

  return (
    <Draggable draggableId={sub.id} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => cardModal.onOpen(sub.id)}
          className="border-2 border-transparent hover:border-black bg-white rounded-md shadow-sm px-2.5 py-1.5 text-xs cursor-pointer"
          style={provided.draggableProps.style as CSSProperties | undefined}
        >
          <div className="flex items-center gap-1.5">
            <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", dotColor)} />
            <p className={cn("truncate flex-1", sub.completed && "line-through text-muted-foreground")}>
              {sub.title}
            </p>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[10px] font-mono text-muted-foreground/50">#{sub.cardNumber}</span>
            {sub.members.length > 0 && (
              <div className="flex -space-x-1">
                {sub.members.slice(0, 2).map((m) => (
                  <Avatar key={m.id} className="h-4 w-4 border border-white">
                    <AvatarImage src={m.userImage} alt={m.userName} />
                    <AvatarFallback className="text-[8px]">{m.userName.charAt(0)}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
};
