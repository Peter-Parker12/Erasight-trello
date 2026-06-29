"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, X, ChevronDown, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export type ProductCategoryDef = {
  id: string;
  name: string;
  color: string;
  order: number;
};

/** Coloured pill badge for a single category */
export const CategoryBadge = ({
  name,
  color,
  onRemove,
  size = "sm",
}: {
  name: string;
  color: string;
  onRemove?: () => void;
  size?: "sm" | "xs";
}) => (
  <span
    className={cn(
      "inline-flex items-center gap-1 rounded font-medium whitespace-nowrap",
      size === "xs" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs"
    )}
    style={{ backgroundColor: color + "30", color }}
  >
    {name}
    {onRemove && (
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="hover:opacity-70 ml-0.5"
      >
        <X className="h-3 w-3" />
      </button>
    )}
  </span>
);

type CategorySelectProps = {
  value: string[];
  onChange: (v: string[]) => void;
  categories: ProductCategoryDef[];
  onCategoryCreated: (cat: ProductCategoryDef) => void;
};

/**
 * Multi-select dropdown with inline "create new" option.
 * Shows selected categories as coloured badges; dropdown lists all org categories.
 */
export const CategorySelect = ({
  value,
  onChange,
  categories,
  onCategoryCreated,
}: CategorySelectProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const toggle = (name: string) => {
    onChange(value.includes(name) ? value.filter((v) => v !== name) : [...value, name]);
  };

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const canCreate =
    search.trim().length > 0 &&
    !categories.some((c) => c.name.toLowerCase() === search.trim().toLowerCase());

  const handleCreate = async () => {
    if (!search.trim() || creating) return;
    setCreating(true);
    try {
      const res = await fetch("/api/crm/product-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: search.trim() }),
      });
      if (!res.ok) { toast.error("Failed to create category."); return; }
      const cat: ProductCategoryDef = await res.json();
      onCategoryCreated(cat);
      onChange([...value, cat.name]);
      setSearch("");
    } catch {
      toast.error("Failed to create category.");
    } finally {
      setCreating(false);
    }
  };

  const selected = value
    .map((name) => categories.find((c) => c.name === name))
    .filter(Boolean) as ProductCategoryDef[];

  return (
    <div ref={ref} className="relative">
      {/* Selected badges + trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "w-full min-h-[32px] flex flex-wrap items-center gap-1.5 px-2 py-1",
          "rounded-md border border-[#333] bg-[#2a2a2a] text-left",
          "hover:border-[#555] focus:outline-none focus:border-blue-500 transition-colors"
        )}
      >
        {selected.length > 0 ? (
          selected.map((cat) => (
            <CategoryBadge
              key={cat.name}
              name={cat.name}
              color={cat.color}
              onRemove={() => toggle(cat.name)}
            />
          ))
        ) : (
          <span className="text-sm text-muted-foreground">Select categories…</span>
        )}
        <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground ml-auto shrink-0 transition-transform", open && "rotate-180")} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-[#333] bg-[#1f1f1f] shadow-xl overflow-hidden">
          {/* Search / create input */}
          <div className="px-2 py-1.5 border-b border-[#333]">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canCreate) { e.preventDefault(); handleCreate(); }
                if (e.key === "Escape") setOpen(false);
              }}
              placeholder="Search or create…"
              className="w-full text-sm bg-transparent text-[#e5e5e5] focus:outline-none placeholder:text-muted-foreground/50"
            />
          </div>

          {/* Options list */}
          <ul className="max-h-48 overflow-y-auto py-1">
            {filtered.length === 0 && !canCreate && (
              <li className="px-3 py-2 text-xs text-muted-foreground italic">
                No categories found.
              </li>
            )}
            {filtered.map((cat) => (
              <li key={cat.id}>
                <button
                  type="button"
                  onClick={() => toggle(cat.name)}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-[#2a2a2a]"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="flex-1 text-left text-[#e5e5e5]">{cat.name}</span>
                  {value.includes(cat.name) && (
                    <Check className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                  )}
                </button>
              </li>
            ))}

            {canCreate && (
              <li>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={creating}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-violet-400 hover:bg-violet-600/10"
                >
                  {creating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Plus className="h-3.5 w-3.5" />
                  )}
                  Create &ldquo;{search.trim()}&rdquo;
                </button>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
