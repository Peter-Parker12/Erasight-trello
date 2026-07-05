"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

// Spreadsheet color conventions:
//  - blue text  = a number the user can edit (target / actual)
//  - black text = computed, not editable (rendered by callers, not here)
//  - yellow bg  = cell awaiting this period's update
type Props = {
  value: number | null;
  canEdit: boolean;
  needsUpdate?: boolean;
  onSave: (value: number) => void;
  className?: string;
  placeholder?: string;
};

export const EditableValueCell = ({
  value,
  canEdit,
  needsUpdate = false,
  onSave,
  className,
  placeholder = "—",
}: Props) => {
  const [text, setText] = useState(value === null ? "" : String(value));
  const [prevValue, setPrevValue] = useState(value);

  // sync with server value when it changes (adjust-state-during-render pattern)
  if (prevValue !== value) {
    setPrevValue(value);
    setText(value === null ? "" : String(value));
  }

  const commit = () => {
    if (text.trim() === "") {
      setText(value === null ? "" : String(value));
      return;
    }
    const parsed = Number(text);
    if (Number.isNaN(parsed)) {
      setText(value === null ? "" : String(value));
      return;
    }
    if (parsed !== value) onSave(parsed);
  };

  if (!canEdit) {
    return (
      <span
        className={cn(
          "inline-block px-1.5 py-0.5 text-sm tabular-nums",
          needsUpdate && "bg-yellow-100 rounded",
          value === null && "text-neutral-400",
          className
        )}
      >
        {value === null ? placeholder : value}
      </span>
    );
  }

  return (
    <input
      type="text"
      inputMode="decimal"
      value={text}
      placeholder={placeholder}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        if (e.key === "Escape") {
          setText(value === null ? "" : String(value));
          (e.target as HTMLInputElement).blur();
        }
      }}
      className={cn(
        "w-20 rounded border border-transparent bg-transparent px-1.5 py-0.5 text-sm tabular-nums",
        "text-blue-600 font-semibold",
        "hover:border-[#555] focus:border-blue-400 focus:outline-none focus:bg-[#333]",
        needsUpdate && "bg-yellow-100",
        className
      )}
    />
  );
};
