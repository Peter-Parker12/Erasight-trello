"use client";

import { format } from "date-fns";
import { CalendarDays, Flag } from "lucide-react";
import { Priority } from "@prisma/client";

import { CardWithFullDetail } from "@/types";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const PRIORITY_CONFIG: Record<Priority, { label: string; className: string }> = {
  NONE: { label: "None", className: "bg-gray-100 text-gray-600" },
  LOW: { label: "Low", className: "bg-blue-100 text-blue-700" },
  MEDIUM: { label: "Medium", className: "bg-yellow-100 text-yellow-700" },
  HIGH: { label: "High", className: "bg-orange-100 text-orange-700" },
  URGENT: { label: "Urgent", className: "bg-red-100 text-red-700" },
};

type CardMetaProps = { data: CardWithFullDetail };

export const CardMeta = ({ data }: CardMetaProps) => {
  const due = data.dueDate ? new Date(data.dueDate) : null;
  const now = new Date();
  const dueSoon = due && !data.completed && due > now && (due.getTime() - now.getTime()) < 86400000 * 2;
  const overdue = due && !data.completed && due < now;

  const priorityCfg = PRIORITY_CONFIG[data.priority];

  const hasLabels = data.labels.length > 0;
  const hasMembers = data.members.length > 0;

  if (!hasLabels && !hasMembers && data.priority === "NONE" && !due && !data.startDate) return null;

  return (
    <div className="flex flex-wrap gap-4 text-sm">
      {/* Labels */}
      {hasLabels && (
        <div>
          <p className="text-xs text-muted-foreground mb-1 font-medium">Labels</p>
          <div className="flex flex-wrap gap-1">
            {data.labels.map(({ label }) => (
              <span
                key={label.id}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold text-white"
                style={{ backgroundColor: label.color }}
              >
                {label.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Members */}
      {hasMembers && (
        <div>
          <p className="text-xs text-muted-foreground mb-1 font-medium">Members</p>
          <div className="flex -space-x-2">
            {data.members.map((m) => (
              <Avatar key={m.id} className="h-7 w-7 border-2 border-white">
                <AvatarImage src={m.userImage} alt={m.userName} />
                <AvatarFallback className="text-xs">{m.userName.charAt(0)}</AvatarFallback>
              </Avatar>
            ))}
          </div>
        </div>
      )}

      {/* Priority */}
      {data.priority !== "NONE" && (
        <div>
          <p className="text-xs text-muted-foreground mb-1 font-medium">Priority</p>
          <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold", priorityCfg.className)}>
            <Flag className="h-3 w-3" />
            {priorityCfg.label}
          </span>
        </div>
      )}

      {/* Dates */}
      {(data.startDate || due) && (
        <div>
          <p className="text-xs text-muted-foreground mb-1 font-medium">Dates</p>
          <div className="flex items-center gap-1">
            {data.startDate && (
              <span className="text-xs text-muted-foreground">
                {format(new Date(data.startDate), "MMM d")} →
              </span>
            )}
            {due && (
              <span className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium",
                data.completed ? "bg-green-100 text-green-700" :
                overdue ? "bg-red-100 text-red-700" :
                dueSoon ? "bg-yellow-100 text-yellow-700" :
                "bg-gray-100 text-gray-700"
              )}>
                <CalendarDays className="h-3 w-3" />
                {format(due, "MMM d")}
                {data.completed && " ✓"}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
