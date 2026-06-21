"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { LayoutGrid, List, Calendar, GanttChart } from "lucide-react";

import { cn } from "@/lib/utils";

export const ViewToggle = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentView = searchParams.get("view") ?? "board";

  const setView = (view: "board" | "list" | "calendar" | "gantt") => {
    const params = new URLSearchParams(searchParams.toString());
    if (view === "board") {
      params.delete("view");
    } else {
      params.set("view", view);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const tabs = [
    { value: "board" as const, icon: LayoutGrid, label: "Board" },
    { value: "list" as const, icon: List, label: "List" },
    { value: "calendar" as const, icon: Calendar, label: "Calendar" },
    { value: "gantt" as const, icon: GanttChart, label: "Gantt" },
  ];

  return (
    <div className="flex items-center gap-1 bg-black/20 rounded-md p-0.5">
      {tabs.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setView(value)}
          title={`${label} view`}
          className={cn(
            "flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded text-xs font-medium transition-colors",
            currentView === value
              ? "bg-[#e5e5e5] text-[#171717] shadow-sm"
              : "text-white/80 hover:text-white"
          )}
        >
          <Icon className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
};
