"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { BoardListOption } from "@/types";
import { useAction } from "@/hooks/use-action";
import { moveCardToList } from "@/actions/move-card-to-list";
import { statusColor } from "./list-color";

type StatusSelectProps = {
  cardId: string;
  boardId: string;
  currentListId: string;
  lists: BoardListOption[];
};

export const StatusSelect = ({ cardId, boardId, currentListId, lists }: StatusSelectProps) => {
  const router = useRouter();

  const { execute, isLoading } = useAction(moveCardToList, {
    onSuccess: () => {
      toast.success("Status updated");
      router.refresh();
    },
    onError: (error) => toast.error(error),
  });

  const current = lists.find((l) => l.id === currentListId);
  const sorted = [...lists].sort((a, b) => a.order - b.order);

  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const listId = e.target.value;
    if (listId === currentListId) return;
    execute({ id: cardId, boardId, listId });
  };

  return (
    <select
      value={currentListId}
      onChange={onChange}
      onClick={(e) => e.stopPropagation()}
      disabled={isLoading}
      className="text-xs px-2 py-0.5 rounded-full font-medium text-white border-0 cursor-pointer disabled:opacity-60"
      style={{ backgroundColor: current ? statusColor(current) : "#6b7280" }}
    >
      {sorted.map((list) => (
        <option key={list.id} value={list.id} style={{ color: "#000" }}>
          {list.title}
        </option>
      ))}
    </select>
  );
};
