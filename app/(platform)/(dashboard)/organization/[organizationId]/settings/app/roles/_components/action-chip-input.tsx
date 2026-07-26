"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { RBAC_ACTION_SUGGESTIONS } from "@/lib/rbac-actions";

type ActionChipInputProps = {
  value: string[];
  onChange: (v: string[]) => void;
};

/**
 * Freeform chip input for a role's action list. Suggestions are drawn from
 * RBAC_ACTION_SUGGESTIONS (the same constants real enforcement code checks),
 * but admins can add any ad-hoc string beyond that list.
 */
export const ActionChipInput = ({ value, onChange }: ActionChipInputProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const add = (action: string) => {
    const trimmed = action.trim();
    if (!trimmed || value.includes(trimmed)) return;
    onChange([...value, trimmed]);
    setSearch("");
  };

  const remove = (action: string) => {
    onChange(value.filter((v) => v !== action));
  };

  const filtered = RBAC_ACTION_SUGGESTIONS.filter(
    (a) => !value.includes(a) && a.toLowerCase().includes(search.toLowerCase())
  );

  const canAddAdHoc =
    search.trim().length > 0 && !RBAC_ACTION_SUGGESTIONS.includes(search.trim() as never);

  return (
    <div ref={ref} className="relative">
      <div
        className={cn(
          "w-full min-h-[32px] flex flex-wrap items-center gap-1.5 px-2 py-1",
          "rounded-md border border-border bg-secondary"
        )}
      >
        {value.map((action) => (
          <span
            key={action}
            className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-mono bg-primary/20 text-primary"
          >
            {action}
            <button type="button" onClick={() => remove(action)} className="hover:opacity-70">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (canAddAdHoc) add(search);
              else if (filtered[0]) add(filtered[0]);
            }
            if (e.key === "Escape") setOpen(false);
          }}
          placeholder={value.length === 0 ? "e.g. board:create" : ""}
          className="flex-1 min-w-[120px] text-sm bg-transparent text-foreground focus:outline-none placeholder:text-muted-foreground/50"
        />
      </div>

      {open && (search.length > 0 || filtered.length > 0) && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-xl overflow-hidden">
          <ul className="max-h-48 overflow-y-auto py-1">
            {filtered.map((action) => (
              <li key={action}>
                <button
                  type="button"
                  onClick={() => add(action)}
                  className="w-full text-left px-3 py-1.5 text-xs font-mono hover:bg-secondary transition-colors"
                >
                  {action}
                </button>
              </li>
            ))}
            {canAddAdHoc && (
              <li>
                <button
                  type="button"
                  onClick={() => add(search)}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-primary hover:bg-primary/10"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add &ldquo;{search.trim()}&rdquo;
                </button>
              </li>
            )}
            {filtered.length === 0 && !canAddAdHoc && (
              <li className="px-3 py-2 text-xs text-muted-foreground italic">
                Type to add an action.
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
