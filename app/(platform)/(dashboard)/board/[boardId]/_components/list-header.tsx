"use client";

import { useState, useEffect, useRef, ElementRef } from "react";
import { toast } from "sonner";
import { useEventListener } from "usehooks-ts";
import { List } from "@prisma/client";

import { FormInput } from "@/components/form/form-input";
import { ListOptions } from "./list-options";
import { useAction } from "@/hooks/use-action";
import { updateList } from "@/actions/update-list";
import { updateListWip } from "@/actions/update-list-wip";
import { cn } from "@/lib/utils";

type ListHeaderProps = {
  data: List & { _cardCount?: number };
  onAddCard: () => void;
};

export const ListHeader = ({ data, onAddCard }: ListHeaderProps) => {
  const [title, setTitle] = useState(data.title);
  const [isEditing, setIsEditing] = useState(false);
  const [wipEditing, setWipEditing] = useState(false);
  const [wipInput, setWipInput] = useState(data.wipLimit?.toString() ?? "");

  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const wipRef = useRef<HTMLInputElement>(null);

  const cardCount = data._cardCount ?? 0;
  const wipExceeded = data.wipLimit != null && cardCount > data.wipLimit;

  const enableEditing = () => {
    setIsEditing(true);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  };

  const disableEditing = () => setIsEditing(false);

  const { execute } = useAction(updateList, {
    onSuccess: (data) => {
      toast.success(`Renamed to "${data.title}"`);
      setTitle(data.title);
      disableEditing();
    },
    onError: (error) => toast.error(error),
  });

  const { execute: execWip } = useAction(updateListWip, {
    onSuccess: () => setWipEditing(false),
    onError: (e) => toast.error(e),
  });

  const onSubmit = (formData: FormData) => {
    const title = formData.get("title") as string;
    const id = formData.get("id") as string;
    const boardId = formData.get("boardId") as string;
    if (title === data.title) return disableEditing();
    execute({ title, id, boardId });
  };

  const onBlur = () => formRef.current?.requestSubmit();

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") formRef.current?.requestSubmit();
  };

  useEventListener("keydown", onKeyDown);

  const saveWip = () => {
    const val = wipInput.trim();
    const num = val === "" ? null : parseInt(val, 10);
    if (val !== "" && (isNaN(num!) || num! < 0)) return;
    execWip({ id: data.id, boardId: data.boardId, wipLimit: num });
  };

  return (
    <div className="pt-2 px-2 text-sm font-semibold flex flex-col gap-1">
      <div className="flex justify-between items-start gap-x-2">
        {isEditing ? (
          <form ref={formRef} action={onSubmit} className="flex-1 px-[2px]">
            <input type="hidden" name="id" value={data.id} />
            <input type="hidden" name="boardId" value={data.boardId} />
            <FormInput
              ref={inputRef}
              onBlur={onBlur}
              id="title"
              placeholder="Enter list title.."
              defaultValue={title}
              className="text-sm px-[7px] py-1 h-7 font-medium border-transparent hover:border-input focus:border-input transition truncate bg-transparent focus:bg-secondary"
            />
            <button type="button" hidden aria-disabled />
          </form>
        ) : (
          <div
            onClick={enableEditing}
            className="w-full text-sm px-2.5 py-1 h-7 font-medium border-transparent cursor-text flex items-center gap-2"
          >
            <span className="truncate">{data.title}</span>
            {data.type !== "STANDARD" && (
              <span
                className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wide shrink-0",
                  data.type === "DONE" && "bg-green-500/20 text-green-400",
                  data.type === "FAILED" && "bg-red-500/20 text-red-400",
                  data.type === "CANCELLED" && "bg-muted text-muted-foreground"
                )}
              >
                {data.type}
              </span>
            )}
          </div>
        )}

        <ListOptions data={data} onAddCard={onAddCard} />
      </div>

      {/* WIP indicator */}
      <div className="px-2 flex items-center gap-1.5">
        {wipEditing ? (
          <div className="flex items-center gap-1">
            <input
              ref={wipRef}
              type="number"
              min="0"
              value={wipInput}
              onChange={(e) => setWipInput(e.target.value)}
              placeholder="No limit"
              className="w-20 text-xs border border-input rounded px-1.5 py-0.5 bg-input text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              onKeyDown={(e) => { if (e.key === "Enter") saveWip(); if (e.key === "Escape") setWipEditing(false); }}
              autoFocus
            />
            <button onClick={saveWip} className="text-xs text-violet-400 hover:underline">Save</button>
            <button onClick={() => setWipEditing(false)} className="text-xs text-muted-foreground hover:underline">✕</button>
          </div>
        ) : (
          <button
            onClick={() => { setWipEditing(true); setTimeout(() => wipRef.current?.focus()); }}
            className={cn(
              "text-xs rounded px-1.5 py-0.5 font-medium transition",
              data.wipLimit == null
                ? "text-muted-foreground hover:bg-muted"
                : wipExceeded
                ? "bg-red-500/20 text-red-400 animate-pulse"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {data.wipLimit == null
              ? "Set WIP limit"
              : wipExceeded
              ? `⚠ ${cardCount}/${data.wipLimit} WIP exceeded`
              : `${cardCount}/${data.wipLimit} WIP`}
          </button>
        )}
      </div>
    </div>
  );
};

