"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { GitBranch, Plus, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Card, CardMember } from "@prisma/client";

import { useAction } from "@/hooks/use-action";
import { createSubtask } from "@/actions/create-subtask";
import { toggleSubtaskComplete } from "@/actions/toggle-subtask-complete";
import { useCardModal } from "@/hooks/use-card-modal";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type SubtaskWithMembers = Card & { members: CardMember[] };

type SubtasksProps = {
  data: {
    id: string;
    listId: string;
    subtasks: SubtaskWithMembers[];
  };
};

const PRIORITY_DOT: Record<string, string> = {
  NONE: "bg-gray-300",
  LOW: "bg-blue-400",
  MEDIUM: "bg-yellow-400",
  HIGH: "bg-orange-400",
  URGENT: "bg-red-500",
};

export const Subtasks = ({ data }: SubtasksProps) => {
  const params = useParams();
  const boardId = params.boardId as string;
  const queryClient = useQueryClient();
  const cardModal = useCardModal();

  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");

  const done = data.subtasks.filter((s) => s.completed).length;
  const total = data.subtasks.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  const { execute } = useAction(createSubtask, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["card", data.id] });
      setTitle("");
      setIsAdding(false);
      toast.success("Subtask created");
    },
    onError: (e) => toast.error(e),
  });

  const { execute: execToggle } = useAction(toggleSubtaskComplete, {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["card", data.id] }),
    onError: (e) => toast.error(e),
  });

  return (
    <div className="flex items-start gap-x-3 w-full">
      <GitBranch className="h-5 w-5 mt-0.5 text-neutral-700 shrink-0" />
      <div className="w-full">
        <div className="flex items-center justify-between mb-2">
          <p className="font-semibold text-neutral-700">
            Subtasks
            {total > 0 && (
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                {done}/{total}
              </span>
            )}
          </p>
          <button
            onClick={() => setIsAdding((v) => !v)}
            className="text-xs text-sky-600 hover:underline flex items-center gap-1"
          >
            <Plus className="h-3 w-3" /> Add subtask
          </button>
        </div>

        {/* Progress bar */}
        {total > 0 && (
          <div className="h-1.5 w-full bg-gray-200 rounded-full mb-3">
            <div
              className={cn(
                "h-1.5 rounded-full transition-all",
                pct === 100 ? "bg-green-500" : "bg-sky-500"
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
        )}

        {/* Subtask list */}
        {data.subtasks.length > 0 && (
          <ul className="space-y-1 mb-2">
            {data.subtasks.map((subtask) => (
              <li
                key={subtask.id}
                className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-muted/50 group"
              >
                {/* Checkbox */}
                <button
                  onClick={() => execToggle({ id: subtask.id, boardId, completed: !subtask.completed })}
                  className={cn(
                    "h-4 w-4 rounded border-2 shrink-0 flex items-center justify-center transition-colors",
                    subtask.completed
                      ? "bg-green-500 border-green-500 text-white"
                      : "border-gray-300 hover:border-sky-400"
                  )}
                  title={subtask.completed ? "Mark incomplete" : "Mark complete"}
                >
                  {subtask.completed && (
                    <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                <span
                  className={cn(
                    "flex-1 text-sm truncate",
                    subtask.completed && "line-through text-muted-foreground"
                  )}
                >
                  {subtask.title}
                </span>
                {subtask.members.length > 0 && (
                  <div className="flex -space-x-1">
                    {subtask.members.slice(0, 2).map((m) => (
                      <Avatar key={m.id} className="h-5 w-5 border border-white">
                        <AvatarImage src={m.userImage} />
                        <AvatarFallback className="text-[9px]">{m.userName.charAt(0)}</AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => cardModal.onOpen(subtask.id)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-sky-600 transition"
                  title="Open subtask"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Add subtask input */}
        {isAdding && (
          <div className="flex gap-2 mt-1">
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && title.trim()) {
                  execute({ title: title.trim(), parentCardId: data.id, listId: data.listId, boardId });
                }
                if (e.key === "Escape") setIsAdding(false);
              }}
              placeholder="Subtask title..."
              className="flex-1 text-sm border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-sky-400"
            />
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                if (title.trim()) execute({ title: title.trim(), parentCardId: data.id, listId: data.listId, boardId });
              }}
            >
              Add
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setIsAdding(false)}>
              Cancel
            </Button>
          </div>
        )}

        {total === 0 && !isAdding && (
          <p className="text-xs text-muted-foreground">No subtasks yet.</p>
        )}
      </div>
    </div>
  );
};
