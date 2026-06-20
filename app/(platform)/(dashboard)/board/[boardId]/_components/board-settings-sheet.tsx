"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Settings, Plus, UserPlus, CalendarDays, MessageSquareWarning } from "lucide-react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetcher } from "@/lib/fetcher";
import { useAction } from "@/hooks/use-action";
import { createList } from "@/actions/create-list";
import { upsertListTransitionRule } from "@/actions/upsert-list-transition-rule";

type ListOption = { id: string; title: string; order: number; type: string };

type BoardSettingsSheetProps = {
  boardId: string;
  lists: ListOption[];
};

type RulesMap = Record<string, string[]>;

type LucideIcon = React.ComponentType<{ className?: string }>;

const ACTION_META: Record<string, { label: string; Icon: LucideIcon; onlyFor?: string[] }> = {
  ADD_ASSIGNEE: { label: "Require assignee", Icon: UserPlus },
  ADD_DUE_DATE: { label: "Require due date", Icon: CalendarDays },
  ADD_REASON:   { label: "Require reason",   Icon: MessageSquareWarning, onlyFor: ["FAILED", "CANCELLED"] },
};
const ALL_ACTIONS = ["ADD_ASSIGNEE", "ADD_DUE_DATE", "ADD_REASON"] as const;

type ActionKey = typeof ALL_ACTIONS[number];

function actionsForListType(type: string): ActionKey[] {
  return ALL_ACTIONS.filter((a) => {
    const meta = ACTION_META[a];
    return !meta.onlyFor || meta.onlyFor.includes(type);
  });
}

export const BoardSettingsSheet = ({ boardId, lists }: BoardSettingsSheetProps) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [newListTitle, setNewListTitle] = useState("");
  const [localRules, setLocalRules] = useState<RulesMap>({});

  const { data: listsData } = useQuery<ListOption[]>({
    queryKey: ["board-lists", boardId],
    queryFn: () => fetcher(`/api/boards/${boardId}/lists`),
    enabled: open,
    initialData: lists,
  });

  const currentLists = listsData ?? lists;

  const { data: rulesData, refetch: refetchRules } = useQuery<RulesMap>({
    queryKey: ["transition-rules", boardId],
    queryFn: () => fetcher(`/api/boards/${boardId}/transition-rules`),
    enabled: open,
  });

  // Sync local state only when real server data arrives (rulesData is stable — no new {} each render)
  useEffect(() => {
    if (rulesData) setLocalRules(rulesData);
  }, [rulesData]);

  const { execute: executeCreateList, isLoading: isCreatingList } = useAction(createList, {
    onSuccess: () => {
      toast.success("List created.");
      setNewListTitle("");
      router.refresh();
    },
    onError: (e) => toast.error(e),
  });

  const { execute: executeUpsert } = useAction(upsertListTransitionRule, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transition-rules", boardId] });
      refetchRules();
    },
    onError: (e) => {
      toast.error(e);
      // Revert local optimistic state to server state on failure
      if (rulesData) setLocalRules(rulesData);
    },
  });

  const onCreateList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListTitle.trim()) return;
    executeCreateList({ title: newListTitle.trim(), boardId });
  };

  const onToggleAction = (listId: string, action: ActionKey, enabled: boolean) => {
    const current = localRules[listId] ?? [];
    const next = enabled ? [...current, action] : current.filter((a) => a !== action);
    // Optimistic local update so consecutive toggles read the correct current value
    setLocalRules((prev) => ({ ...prev, [listId]: next }));
    executeUpsert({ boardId, listId, actions: next as ActionKey[] });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="h-auto w-auto p-2 text-white hover:bg-white/20">
          <Settings className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80 sm:w-96 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Board settings</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Add list */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-neutral-700">Lists</h3>
            <ul className="space-y-1">
              {currentLists.map((list) => (
                <li key={list.id} className="text-sm px-2 py-1 rounded bg-neutral-100 text-neutral-700 truncate">
                  {list.title}
                </li>
              ))}
            </ul>
            <form onSubmit={onCreateList} className="flex gap-2">
              <Input
                value={newListTitle}
                onChange={(e) => setNewListTitle(e.target.value)}
                placeholder="New list name…"
                className="h-8 text-sm flex-1"
              />
              <Button type="submit" size="sm" className="h-8" disabled={isCreatingList || !newListTitle.trim()}>
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </form>
          </section>

          {/* Transition rules */}
          <section className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-neutral-700">Transition rules</h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Prompt users for extra info when a card is dropped into a list.
              </p>
            </div>

            {currentLists.length === 0 && (
              <p className="text-xs text-neutral-400">No lists yet.</p>
            )}

            {currentLists.map((list) => {
              const listActions = localRules[list.id] ?? [];
              const availableActions = actionsForListType(list.type);
              return (
                <div key={list.id} className="rounded-md border p-3 space-y-2">
                  <p className="text-sm font-medium truncate">{list.title}</p>
                  <div className="space-y-1.5">
                    {availableActions.map((action) => {
                      const checked = listActions.includes(action);
                      const { label, Icon } = ACTION_META[action];
                      return (
                        <label
                          key={action}
                          className="flex items-center gap-2 cursor-pointer select-none"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => onToggleAction(list.id, action, e.target.checked)}
                            className="h-3.5 w-3.5 accent-sky-600"
                          />
                          <span className="flex items-center gap-1.5 text-xs text-neutral-700">
                            <Icon className="h-3.5 w-3.5" />
                            {label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
};
