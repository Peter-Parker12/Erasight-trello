"use client";

import { useState } from "react";
import { toast } from "sonner";
import { DragDropContext, type DropResult, Droppable } from "@hello-pangea/dnd";

import { ListForm } from "./list-form";
import { ListItem } from "./list-item";
import { BoardFilterBar } from "./board-filter-bar";
import { SubtaskGroupBoard } from "./subtask-group-board";
import type { ListWithCards } from "@/types";
import { useAction } from "@/hooks/use-action";
import { updateListOrder } from "@/actions/update-list-order";
import { updateCardOrder } from "@/actions/update-card-order";
import { useBoardFilter } from "@/hooks/use-board-filter";

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
  const { filter, update, reset, isActive, applyFilter } = useBoardFilter();

  if (data !== prevData) {
    setPrevData(data);
    setOrderedData(data);
  }

  const { execute: executeUpdateListOrder } = useAction(updateListOrder, {
    onSuccess: (data) => {
      toast.success("List reordered");
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  const { execute: executeUpdateCardOrder } = useAction(updateCardOrder, {
    onSuccess: (data) => {
      toast.success("Card reordered");
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  const onDragEnd = (result: DropResult) => {
    const { destination, source, type } = result;

    // if no destination
    if (!destination) return;

    // if dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    // user moves a list
    if (type === "list") {
      const items = reorder(orderedData, source.index, destination.index).map(
        (item, index) => ({ ...item, order: index })
      );

      setOrderedData(items);

      // update list order in server
      executeUpdateListOrder({
        items,
        boardId,
      });
    }

    // user moves a card
    if (type === "card") {
      let newOrderedData = [...orderedData];

      // source and destination list
      const sourceList = newOrderedData.find(
        (list) => list.id === source.droppableId
      );

      const destinationList = newOrderedData.find(
        (list) => list.id === destination.droppableId
      );

      if (!sourceList || !destinationList) return;

      // check if cards exists on the source list
      if (!sourceList.cards) sourceList.cards = [];

      // check if cards exists on the destination list
      if (!destinationList.cards) destinationList.cards = [];

      // cards with subtasks are rendered in the grouped board above, not in
      // this column, so they must be excluded when re-indexing drag positions
      const sourceGrouped = sourceList.cards.filter((card) => card.subtasks.length > 0);
      const sourceStandalone = sourceList.cards.filter((card) => card.subtasks.length === 0);

      // moving the card in the same list
      if (source.droppableId === destination.droppableId) {
        const reorderedCards = reorder(
          sourceStandalone,
          source.index,
          destination.index
        );

        reorderedCards.forEach((card, i) => {
          card.order = i;
        });

        sourceList.cards = [...sourceGrouped, ...reorderedCards];
        setOrderedData(newOrderedData);

        executeUpdateCardOrder({
          boardId,
          items: reorderedCards,
        });
      }
      // user moves card to another list
      else {
        const destinationGrouped = destinationList.cards.filter((card) => card.subtasks.length > 0);
        const destinationStandalone = destinationList.cards.filter((card) => card.subtasks.length === 0);

        // remove card from the source list
        const [movedCard] = sourceStandalone.splice(source.index, 1);

        // assign the new list id to the moved card
        movedCard.listId = destination.droppableId;

        // add new card to the destination list
        destinationStandalone.splice(destination.index, 0, movedCard);

        sourceStandalone.forEach((card, i) => {
          card.order = i;
        });

        // update the order for each card in destination list
        destinationStandalone.forEach((card, i) => {
          card.order = i;
        });

        sourceList.cards = [...sourceGrouped, ...sourceStandalone];
        destinationList.cards = [...destinationGrouped, ...destinationStandalone];

        setOrderedData(newOrderedData);

        executeUpdateCardOrder({
          boardId: boardId,
          items: destinationStandalone,
        });
      }
    }
  };

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

      <SubtaskGroupBoard lists={orderedData} parents={filteredGroupedParents} boardId={boardId} />

    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="lists" type="list" direction="horizontal">
        {(provided) => (
          <ol
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="flex gap-x-3 h-full px-2 sm:px-4 pt-3 snap-x snap-mandatory sm:snap-none"
          >
            {orderedData.map((list, i) => (
              <ListItem key={list.id} index={i} data={{
                ...list,
                cards: (isActive ? applyFilter(list.cards) : list.cards).filter((card) => card.subtasks.length === 0),
              }} />
            ))}

            {provided.placeholder}

            <ListForm />
            <div aria-hidden className="flex-shrink-0 w-1" />
          </ol>
        )}
      </Droppable>
    </DragDropContext>
    </>
  );
};
