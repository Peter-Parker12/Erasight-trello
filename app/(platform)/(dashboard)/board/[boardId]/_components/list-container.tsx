"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DragDropContext, type DropResult, Droppable } from "@hello-pangea/dnd";

import { ListForm } from "./list-form";
import { ListItem } from "./list-item";
import { BoardFilterBar } from "./board-filter-bar";
import { SubtaskGroupBoard } from "./subtask-group-board";
import { TransitionActionModal } from "./transition-action-modal";
import type { ListWithCards, CardPreview } from "@/types";
import { useAction } from "@/hooks/use-action";
import { updateListOrder } from "@/actions/update-list-order";
import { updateCardOrder } from "@/actions/update-card-order";
import { addCardMember } from "@/actions/manage-card-members";
import { updateCardDates } from "@/actions/update-card-dates";
import { updateCard } from "@/actions/update-card";
import { useBoardFilter } from "@/hooks/use-board-filter";

type OrgMember = { userId: string; userName: string; userImage: string; role: string; isBoardMember: boolean };

type PendingDrop = {
  movedCard: CardPreview;
  destinationListId: string;
  destinationItems: CardPreview[];
  snapshot: ListWithCards[];
};

type ListContainerProps = {
  data: ListWithCards[];
  boardId: string;
};

function reorder<T>(list: T[], startIndex: number, endIndex: number) {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
}

export const ListContainer = ({ data, boardId }: ListContainerProps) => {
  const [orderedData, setOrderedData] = useState(data);
  const [prevData, setPrevData] = useState(data);
  const [transitionRules, setTransitionRules] = useState<Record<string, string[]>>({});
  const [pendingDrop, setPendingDrop] = useState<PendingDrop | null>(null);
  const { filter, update, reset, isActive, applyFilter } = useBoardFilter();

  if (data !== prevData) {
    setPrevData(data);
    setOrderedData(data);
  }

  useEffect(() => {
    fetch(`/api/boards/${boardId}/transition-rules`)
      .then((r) => (r.ok ? r.json() : {}))
      .then(setTransitionRules)
      .catch(() => {});
  }, [boardId]);

  const { execute: executeUpdateListOrder } = useAction(updateListOrder, {
    onSuccess: () => toast.success("List reordered"),
    onError: (error) => toast.error(error),
  });

  const { execute: executeUpdateCardOrder } = useAction(updateCardOrder, {
    onSuccess: () => toast.success("Card moved"),
    onError: (error) => toast.error(error),
  });

  const { execute: executeAddMember } = useAction(addCardMember, {
    onError: (e) => toast.error(e),
  });

  const { execute: executeUpdateDates } = useAction(updateCardDates, {
    onError: (e) => toast.error(e),
  });

  const { execute: executeUpdateCard } = useAction(updateCard, {
    onError: (e) => toast.error(e),
  });

  const commitCrossListMove = (items: CardPreview[], boardId: string) => {
    executeUpdateCardOrder({ boardId, items });
  };

  const onDragEnd = (result: DropResult) => {
    const { destination, source, type } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    if (type === "list") {
      const items = reorder(orderedData, source.index, destination.index).map(
        (item, index) => ({ ...item, order: index })
      );
      setOrderedData(items);
      executeUpdateListOrder({ items, boardId });
    }

    if (type === "card") {
      let newOrderedData = [...orderedData];

      const sourceList = newOrderedData.find((list) => list.id === source.droppableId);
      const destinationList = newOrderedData.find((list) => list.id === destination.droppableId);
      if (!sourceList || !destinationList) return;

      if (!sourceList.cards) sourceList.cards = [];
      if (!destinationList.cards) destinationList.cards = [];

      const sourceGrouped = sourceList.cards.filter((card) => card.subtasks.length > 0);
      const sourceStandalone = sourceList.cards.filter((card) => card.subtasks.length === 0);

      // same-list reorder — no transition rule applies
      if (source.droppableId === destination.droppableId) {
        const reorderedCards = reorder(sourceStandalone, source.index, destination.index);
        reorderedCards.forEach((card, i) => { card.order = i; });
        sourceList.cards = [...sourceGrouped, ...reorderedCards];
        setOrderedData(newOrderedData);
        executeUpdateCardOrder({ boardId, items: reorderedCards });
        return;
      }

      // cross-list move
      const destinationGrouped = destinationList.cards.filter((card) => card.subtasks.length > 0);
      const destinationStandalone = destinationList.cards.filter((card) => card.subtasks.length === 0);

      const [movedCard] = sourceStandalone.splice(source.index, 1);
      movedCard.listId = destination.droppableId;
      destinationStandalone.splice(destination.index, 0, movedCard);

      sourceStandalone.forEach((card, i) => { card.order = i; });
      destinationStandalone.forEach((card, i) => { card.order = i; });

      sourceList.cards = [...sourceGrouped, ...sourceStandalone];
      destinationList.cards = [...destinationGrouped, ...destinationStandalone];

      const rules = transitionRules[destination.droppableId] ?? [];

      if (rules.length > 0) {
        // Optimistic move — card appears in destination column.
        // Store snapshot to revert if user cancels.
        setOrderedData(newOrderedData);
        setPendingDrop({
          movedCard,
          destinationListId: destination.droppableId,
          destinationItems: destinationStandalone,
          snapshot: orderedData,
        });
      } else {
        setOrderedData(newOrderedData);
        commitCrossListMove(destinationStandalone, boardId);
      }
    }
  };

  const onTransitionConfirm = (assignee: OrgMember | null, dueDate: string | null, reason: string | null) => {
    if (!pendingDrop) return;
    commitCrossListMove(pendingDrop.destinationItems, boardId);
    if (assignee) {
      executeAddMember({
        cardId: pendingDrop.movedCard.id,
        boardId,
        userId: assignee.userId,
        userName: assignee.userName,
        userImage: assignee.userImage,
      });
    }
    if (dueDate) {
      executeUpdateDates({ id: pendingDrop.movedCard.id, boardId, dueDate });
    }
    if (reason) {
      executeUpdateCard({ id: pendingDrop.movedCard.id, boardId, reason });
    }
    setPendingDrop(null);
  };

  const onTransitionCancel = () => {
    if (!pendingDrop) return;
    setOrderedData(pendingDrop.snapshot);
    setPendingDrop(null);
  };

  const destinationListName =
    pendingDrop
      ? (orderedData.find((l) => l.id === pendingDrop.destinationListId)?.title ?? "")
      : "";

  const pendingActions = pendingDrop ? (transitionRules[pendingDrop.destinationListId] ?? []) : [];

  const groupedParents = orderedData.flatMap((list) =>
    list.cards.filter((card) => card.subtasks.length > 0)
  );
  const filteredGroupedParents = isActive ? applyFilter(groupedParents) : groupedParents;

  return (
    <>
      <BoardFilterBar
        lists={orderedData}
        filter={filter}
        update={update}
        reset={reset}
        isActive={isActive}
      />

      <SubtaskGroupBoard
        lists={orderedData}
        parents={filteredGroupedParents}
        boardId={boardId}
        transitionRules={transitionRules}
      />

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="lists" type="list" direction="horizontal">
          {(provided) => (
            <ol
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="flex gap-x-3 h-full px-2 sm:px-4 pt-3 snap-x snap-mandatory sm:snap-none"
            >
              {orderedData.map((list, i) => (
                <ListItem
                  key={list.id}
                  index={i}
                  data={{
                    ...list,
                    cards: (isActive ? applyFilter(list.cards) : list.cards).filter(
                      (card) => card.subtasks.length === 0
                    ),
                  }}
                />
              ))}
              {provided.placeholder}
              <ListForm />
              <div aria-hidden className="flex-shrink-0 w-1" />
            </ol>
          )}
        </Droppable>
      </DragDropContext>

      <TransitionActionModal
        open={!!pendingDrop}
        boardId={boardId}
        destinationListName={destinationListName}
        actions={pendingActions}
        onConfirm={onTransitionConfirm}
        onCancel={onTransitionCancel}
      />
    </>
  );
};
