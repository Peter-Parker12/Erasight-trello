"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { CheckSquare, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { CardWithFullDetail } from "@/types";
import { useAction } from "@/hooks/use-action";
import { createChecklist } from "@/actions/create-checklist";
import { deleteChecklist } from "@/actions/delete-checklist";
import { createChecklistItem } from "@/actions/create-checklist-item";
import { updateChecklistItem } from "@/actions/update-checklist-item";
import { deleteChecklistItem } from "@/actions/delete-checklist-item";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type ChecklistsProps = { data: CardWithFullDetail };

export const Checklists = ({ data }: ChecklistsProps) => {
  const params = useParams();
  const boardId = params.boardId as string;
  const queryClient = useQueryClient();
  const [addingId, setAddingId] = useState<string | null>(null);
  const [newItemContent, setNewItemContent] = useState("");
  const [showNewChecklist, setShowNewChecklist] = useState(false);
  const [newChecklistTitle, setNewChecklistTitle] = useState("");

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["card", data.id] });

  const { execute: execCreate } = useAction(createChecklist, {
    onSuccess: () => { invalidate(); setShowNewChecklist(false); setNewChecklistTitle(""); },
    onError: (e) => toast.error(e),
  });

  const { execute: execDelete } = useAction(deleteChecklist, {
    onSuccess: () => invalidate(),
    onError: (e) => toast.error(e),
  });

  const { execute: execCreateItem } = useAction(createChecklistItem, {
    onSuccess: () => { invalidate(); setNewItemContent(""); setAddingId(null); },
    onError: (e) => toast.error(e),
  });

  const { execute: execUpdateItem } = useAction(updateChecklistItem, {
    onSuccess: () => invalidate(),
    onError: (e) => toast.error(e),
  });

  const { execute: execDeleteItem } = useAction(deleteChecklistItem, {
    onSuccess: () => invalidate(),
    onError: (e) => toast.error(e),
  });

  if (data.checklists.length === 0 && !showNewChecklist) return null;

  return (
    <div className="space-y-4">
      {data.checklists.map((checklist) => {
        const total = checklist.items.length;
        const done = checklist.items.filter((i) => i.completed).length;
        const percent = total === 0 ? 0 : Math.round((done / total) * 100);

        return (
          <div key={checklist.id}>
            <div className="flex items-center gap-x-3 mb-2">
              <CheckSquare className="h-5 w-5 text-[#e5e5e5] shrink-0" />
              <div className="flex-1 flex items-center justify-between">
                <p className="font-semibold text-[#e5e5e5]">{checklist.title}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs text-muted-foreground hover:text-destructive"
                  onClick={() => execDelete({ id: checklist.id, cardId: data.id, boardId })}
                >
                  Delete
                </Button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="flex items-center gap-2 ml-8 mb-2">
              <span className="text-xs text-muted-foreground w-8">{percent}%</span>
              <div className="flex-1 bg-[#444] rounded-full h-2">
                <div
                  className={cn("h-2 rounded-full transition-all", percent === 100 ? "bg-green-500" : "bg-violet-500")}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>

            {/* Items */}
            <div className="ml-8 space-y-1">
              {checklist.items.map((item) => (
                <div key={item.id} className="flex items-start gap-2 group py-0.5">
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => execUpdateItem({ id: item.id, boardId, completed: !item.completed })}
                    className="mt-0.5 h-4 w-4 rounded cursor-pointer accent-sky-600"
                  />
                  <span className={cn("flex-1 text-sm", item.completed && "line-through text-muted-foreground")}>
                    {item.content}
                  </span>
                  <button
                    onClick={() => execDeleteItem({ id: item.id, boardId })}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}

              {/* Add item */}
              {addingId === checklist.id ? (
                <div className="mt-2 space-y-2">
                  <textarea
                    autoFocus
                    value={newItemContent}
                    onChange={(e) => setNewItemContent(e.target.value)}
                    placeholder="Add an item..."
                    className="w-full text-sm border rounded p-2 resize-none focus:outline-none focus:ring-1 focus:ring-sky-500"
                    rows={2}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (newItemContent.trim()) execCreateItem({ checklistId: checklist.id, cardId: data.id, boardId, content: newItemContent.trim() });
                      }
                      if (e.key === "Escape") { setAddingId(null); setNewItemContent(""); }
                    }}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" className="h-7 text-xs" onClick={() => {
                      if (newItemContent.trim()) execCreateItem({ checklistId: checklist.id, cardId: data.id, boardId, content: newItemContent.trim() });
                    }}>Add</Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setAddingId(null); setNewItemContent(""); }}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setAddingId(checklist.id)}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-[#e5e5e5] mt-1 py-0.5"
                >
                  <Plus className="h-3.5 w-3.5" /> Add an item
                </button>
              )}
            </div>
          </div>
        );
      })}

      {/* Add new checklist */}
      {showNewChecklist ? (
        <div className="flex items-start gap-x-3">
          <CheckSquare className="h-5 w-5 mt-1 text-[#e5e5e5] shrink-0" />
          <div className="flex-1 space-y-2">
            <input
              autoFocus
              value={newChecklistTitle}
              onChange={(e) => setNewChecklistTitle(e.target.value)}
              placeholder="Checklist title..."
              className="w-full text-sm border rounded p-2 focus:outline-none focus:ring-1 focus:ring-sky-500"
              onKeyDown={(e) => {
                if (e.key === "Enter" && newChecklistTitle.trim()) execCreate({ cardId: data.id, boardId, title: newChecklistTitle.trim() });
                if (e.key === "Escape") { setShowNewChecklist(false); setNewChecklistTitle(""); }
              }}
            />
            <div className="flex gap-2">
              <Button size="sm" className="h-7 text-xs" onClick={() => {
                if (newChecklistTitle.trim()) execCreate({ cardId: data.id, boardId, title: newChecklistTitle.trim() });
              }}>Add</Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setShowNewChecklist(false); setNewChecklistTitle(""); }}>Cancel</Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
