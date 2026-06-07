"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { LayoutGrid, List } from "lucide-react";

import { cn } from "@/lib/utils";

export const ViewToggle = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentView = searchParams.get("view") ?? "board";

  const setView = (view: "board" | "list") => {
    const params = new URLSearchParams(searchParams.toString());
    if (view === "board") {
      params.delete("view");
    } else {
      params.set("view", view);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-1 bg-black/20 rounded-md p-0.5">
      <button
        onClick={() => setView("board")}
        title="Board view"
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors",
          currentView === "board"
            ? "bg-white text-black shadow-sm"
            : "text-white/80 hover:text-white"
        )}
      >
        <LayoutGrid className="h-3.5 w-3.5" />
        Board
      </button>
      <button
        onClick={() => setView("list")}
        title="List view"
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors",
          currentView === "list"
            ? "bg-white text-black shadow-sm"
            : "text-white/80 hover:text-white"
        )}
      >
        <List className="h-3.5 w-3.5" />
        List
      </button>
    </div>
  );
};
