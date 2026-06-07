"use client";

import { useState } from "react";
import { Paintbrush } from "lucide-react";
import { toast } from "sonner";

import { useAction } from "@/hooks/use-action";
import { updateBoardBackground } from "@/actions/update-board-background";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const SOLID_COLORS = [
  "#1e3a5f", "#1a5276", "#1b4f72", "#0e6655",
  "#1e8449", "#7d6608", "#784212", "#6e2f1a",
  "#641e16", "#4a235a", "#1a237e", "#37474f",
];

const GRADIENTS = [
  { label: "Ocean", value: "linear-gradient(135deg, #667eea, #764ba2)" },
  { label: "Sunset", value: "linear-gradient(135deg, #f093fb, #f5576c)" },
  { label: "Forest", value: "linear-gradient(135deg, #4facfe, #00f2fe)" },
  { label: "Fire", value: "linear-gradient(135deg, #fa709a, #fee140)" },
  { label: "Aurora", value: "linear-gradient(135deg, #a8edea, #fed6e3)" },
  { label: "Night", value: "linear-gradient(135deg, #2c3e50, #4ca1af)" },
  { label: "Peach", value: "linear-gradient(135deg, #ffecd2, #fcb69f)" },
  { label: "Lime", value: "linear-gradient(135deg, #d4fc79, #96e6a1)" },
];

type BoardBackgroundPickerProps = {
  boardId: string;
  onRestoreImage?: () => void;
};

export const BoardBackgroundPicker = ({ boardId }: BoardBackgroundPickerProps) => {
  const [open, setOpen] = useState(false);

  const { execute } = useAction(updateBoardBackground, {
    onSuccess: () => { toast.success("Background updated"); setOpen(false); },
    onError: (e) => toast.error(e),
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="transparent" size="sm" className="h-auto w-auto p-1.5 text-white">
          <Paintbrush className="h-4 w-4" />
          <span className="sr-only">Change background</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3 space-y-3" align="end">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Background</p>

        {/* Restore photo */}
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs"
          onClick={() => execute({ boardId, backgroundType: "image" })}
        >
          Dùng ảnh Unsplash (mặc định)
        </Button>

        {/* Solid colors */}
        <div>
          <p className="text-xs text-muted-foreground mb-1">Màu solid</p>
          <div className="grid grid-cols-6 gap-1">
            {SOLID_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => execute({ boardId, backgroundType: "color", backgroundColor: c })}
                className="w-8 h-8 rounded border-2 border-transparent hover:border-white transition"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* Gradients */}
        <div>
          <p className="text-xs text-muted-foreground mb-1">Gradient</p>
          <div className="grid grid-cols-4 gap-1">
            {GRADIENTS.map((g) => (
              <button
                key={g.value}
                onClick={() => execute({ boardId, backgroundType: "gradient", backgroundColor: g.value })}
                className="w-full h-10 rounded border-2 border-transparent hover:border-white transition text-xs font-medium text-white shadow-sm"
                style={{ background: g.value }}
                title={g.label}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
