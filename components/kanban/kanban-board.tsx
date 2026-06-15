"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import { DragDropContext, Draggable, Droppable, type DropResult } from "@hello-pangea/dnd";

// Generic, data-model-agnostic kanban primitive: a row of droppable columns,
// each containing draggable items. Columns are not reorderable here — column
// order is managed separately (e.g. via an admin "stages" setting).

export type KanbanItem = { id: string };
export type KanbanColumn<TItem extends KanbanItem> = { id: string; items: TItem[] };

export function reorder<T>(list: T[], startIndex: number, endIndex: number): T[] {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
}

export type KanbanMoveResult<TItem extends KanbanItem> = {
  movedItem: TItem;
  sourceColumnId: string;
  destinationColumnId: string;
  destinationItems: TItem[];
};

type KanbanBoardProps<TColumn extends KanbanColumn<TItem>, TItem extends KanbanItem> = {
  columns: TColumn[];
  onItemMove: (result: KanbanMoveResult<TItem>) => void;
  renderColumn: (column: TColumn, itemsNode: ReactNode) => ReactNode;
  renderItem: (item: TItem, index: number) => ReactNode;
};

export function KanbanBoard<TColumn extends KanbanColumn<TItem>, TItem extends KanbanItem>({
  columns,
  onItemMove,
  renderColumn,
  renderItem,
}: KanbanBoardProps<TColumn, TItem>) {
  const [orderedColumns, setOrderedColumns] = useState(columns);
  const [prevColumns, setPrevColumns] = useState(columns);

  if (columns !== prevColumns) {
    setPrevColumns(columns);
    setOrderedColumns(columns);
  }

  const onDragEnd = (result: DropResult) => {
    const { destination, source } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const next = orderedColumns.map((col) => ({ ...col, items: [...col.items] })) as TColumn[];
    const sourceCol = next.find((c) => c.id === source.droppableId);
    const destCol = next.find((c) => c.id === destination.droppableId);
    if (!sourceCol || !destCol) return;

    let movedItem: TItem;

    if (sourceCol === destCol) {
      sourceCol.items = reorder(sourceCol.items, source.index, destination.index);
      movedItem = sourceCol.items[destination.index];
    } else {
      [movedItem] = sourceCol.items.splice(source.index, 1);
      destCol.items.splice(destination.index, 0, movedItem);
    }

    setOrderedColumns(next);

    onItemMove({
      movedItem,
      sourceColumnId: source.droppableId,
      destinationColumnId: destination.droppableId,
      destinationItems: destCol.items,
    });
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-x-3 h-full overflow-x-auto">
        {orderedColumns.map((column) => (
          <Droppable droppableId={column.id} key={column.id}>
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="h-full">
                {renderColumn(
                  column,
                  <>
                    {column.items.map((item, index) => (
                      <Draggable draggableId={item.id} index={index} key={item.id}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={provided.draggableProps.style as CSSProperties | undefined}
                          >
                            {renderItem(item, index)}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </>
                )}
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
}
