"use client";

import { CalendarDays, CheckSquare, MessageSquare, Paperclip, Flag } from "lucide-react";
import { Draggable } from "@hello-pangea/dnd";
import { format } from "date-fns";

import { CardPreview } from "@/types";
import { useCardModal } from "@/hooks/use-card-modal";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

type CardItemProps = {
  data: CardPreview;
  index: number;
};

const PRIORITY_DOT: Record<string, string> = {
  NONE: "",
  LOW: "bg-blue-400",
  MEDIUM: "bg-yellow-400",
  HIGH: "bg-orange-400",
  URGENT: "bg-red-500",
};

export const CardItem = ({ data, index }: CardItemProps) => {
  const cardModal = useCardModal();

  const totalItems = data.checklists.reduce((s, c) => s + c.items.length, 0);
  const doneItems = data.checklists.reduce((s, c) => s + c.items.filter((i) => i.completed).length, 0);
  const hasChecklist = totalItems > 0;

  const due = data.dueDate ? new Date(data.dueDate) : null;
  const now = new Date();
  const overdue = due && !data.completed && due < now;
  const dueSoon = due && !data.completed && due > now && (due.getTime() - now.getTime()) < 86400000 * 2;

  const priorityDot = PRIORITY_DOT[data.priority];

  return (
    <Draggable draggableId={data.id} index={index}>
      {(provided) => (
        <div
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          ref={provided.innerRef}
          role="button"
          onClick={() => cardModal.onOpen(data.id)}
          className="border-2 border-transparent hover:border-black py-2 px-3 text-sm bg-white rounded-md shadow-sm space-y-1.5"
        >
          {/* Cover color */}
          {data.coverColor && (
            <div className="h-2 w-full rounded-sm -mt-1 mb-1" style={{ backgroundColor: data.coverColor }} />
          )}

          {/* Labels */}
          {data.labels.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {data.labels.map(({ label }) => (
                <span
                  key={label.id}
                  className="inline-block h-2 w-10 rounded-full"
                  style={{ backgroundColor: label.color }}
                  title={label.name}
                />
              ))}
            </div>
          )}

          {/* Title + priority dot */}
          <div className="flex items-start gap-1.5">
            {priorityDot && <span className={cn("mt-1.5 h-2 w-2 rounded-full shrink-0", priorityDot)} />}
            <p className="truncate">{data.title}</p>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground/60">#{data.cardNumber}</span>

          {/* Footer stats */}
          {(due || hasChecklist || data._count.comments > 0 || data._count.attachments > 0 || data.members.length > 0) && (
            <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-muted-foreground">
              {due && (
                <span className={cn("flex items-center gap-0.5 text-xs px-1 rounded",
                  data.completed ? "bg-green-100 text-green-700" :
                  overdue ? "bg-red-100 text-red-600" :
                  dueSoon ? "bg-yellow-100 text-yellow-700" : ""
                )}>
                  <CalendarDays className="h-3 w-3" />
                  {format(due, "MMM d")}
                </span>
              )}
              {hasChecklist && (
                <span className={cn("flex items-center gap-0.5 text-xs", doneItems === totalItems && "text-green-600")}>
                  <CheckSquare className="h-3 w-3" />
                  {doneItems}/{totalItems}
                </span>
              )}
              {data._count.comments > 0 && (
                <span className="flex items-center gap-0.5 text-xs">
                  <MessageSquare className="h-3 w-3" /> {data._count.comments}
                </span>
              )}
              {data._count.attachments > 0 && (
                <span className="flex items-center gap-0.5 text-xs">
                  <Paperclip className="h-3 w-3" /> {data._count.attachments}
                </span>
              )}
              {data.members.length > 0 && (
                <div className="flex -space-x-1 ml-auto">
                  {data.members.slice(0, 3).map((m) => (
                    <Avatar key={m.id} className="h-5 w-5 border border-white">
                      <AvatarImage src={m.userImage} alt={m.userName} />
                      <AvatarFallback className="text-[9px]">{m.userName.charAt(0)}</AvatarFallback>
                    </Avatar>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
};

