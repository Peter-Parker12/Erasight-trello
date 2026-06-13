"use client";

import { CSSProperties, useState } from "react";
import { CalendarDays, CheckSquare, Eye, MessageSquare, Paperclip, ChevronDown, ChevronRight } from "lucide-react";
import { Draggable } from "@hello-pangea/dnd";
import { format } from "date-fns";

import { CardPreview } from "@/types";
import { useCardModal } from "@/hooks/use-card-modal";
import { cn } from "@/lib/utils";
import { getEffectiveDueDate } from "@/lib/due-date";
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

const PRIORITY_COLOR: Record<string, string> = {
  NONE: "",
  LOW: "text-blue-500",
  MEDIUM: "text-yellow-500",
  HIGH: "text-orange-500",
  URGENT: "text-red-500",
};

export const CardItem = ({ data, index }: CardItemProps) => {
  const cardModal = useCardModal();
  const [subtasksOpen, setSubtasksOpen] = useState(false);

  const totalItems = data.checklists.reduce((s, c) => s + c.items.length, 0);
  const doneItems = data.checklists.reduce((s, c) => s + c.items.filter((i) => i.completed).length, 0);
  const hasChecklist = totalItems > 0;

  const { date: due, isReview, overdue, dueSoon } = getEffectiveDueDate(data);

  const priorityDot = PRIORITY_DOT[data.priority];
  const hasSubtasks = data.subtasks && data.subtasks.length > 0;
  const doneSubtasks = data.subtasks?.filter((s) => s.completed).length ?? 0;
  const totalSubtasks = data.subtasks?.length ?? 0;

  return (
    <Draggable draggableId={data.id} index={index}>
      {(provided) => (
        <div
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          ref={provided.innerRef}
          className="border-2 border-transparent hover:border-black text-sm bg-white rounded-md shadow-sm overflow-hidden"
          style={provided.draggableProps.style as CSSProperties | undefined}
        >
          {/* Main card body */}
          <div
            role="button"
            onClick={() => cardModal.onOpen(data.id)}
            className="py-2 px-3 space-y-1.5"
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
                    {isReview ? <Eye className="h-3 w-3" /> : <CalendarDays className="h-3 w-3" />}
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

          {/* Subtasks toggle tab */}
          {hasSubtasks && (
            <div className="border-t border-gray-100">
              <button
                onClick={(e) => { e.stopPropagation(); setSubtasksOpen((v) => !v); }}
                className="w-full flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 transition text-xs text-muted-foreground"
              >
                {subtasksOpen
                  ? <ChevronDown className="h-3 w-3 shrink-0" />
                  : <ChevronRight className="h-3 w-3 shrink-0" />}
                <span className="font-medium">
                  Subtasks
                </span>
                <span className={cn(
                  "ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold",
                  doneSubtasks === totalSubtasks ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"
                )}>
                  {doneSubtasks}/{totalSubtasks}
                </span>
                {/* mini progress bar */}
                <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden mx-1">
                  <div
                    className={cn("h-1 rounded-full transition-all", doneSubtasks === totalSubtasks ? "bg-green-500" : "bg-sky-400")}
                    style={{ width: `${totalSubtasks > 0 ? Math.round((doneSubtasks / totalSubtasks) * 100) : 0}%` }}
                  />
                </div>
              </button>

              {subtasksOpen && (
                <div className="divide-y divide-gray-100">
                  {data.subtasks.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={(e) => { e.stopPropagation(); cardModal.onOpen(sub.id); }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-sky-50 transition text-left group"
                    >
                      <span className={cn(
                        "h-1.5 w-1.5 rounded-full shrink-0 mt-0.5",
                        sub.completed ? "bg-green-400" : "bg-gray-300"
                      )} />
                      <span className={cn(
                        "text-xs flex-1 truncate",
                        sub.completed ? "line-through text-muted-foreground" : "text-gray-700 group-hover:text-black"
                      )}>
                        {sub.title}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground/50 shrink-0">#{sub.cardNumber}</span>
                      {sub.members.length > 0 && (
                        <div className="flex -space-x-1 shrink-0">
                          {sub.members.slice(0, 2).map((m) => (
                            <Avatar key={m.id} className="h-4 w-4 border border-white">
                              <AvatarImage src={m.userImage} alt={m.userName} />
                              <AvatarFallback className="text-[8px]">{m.userName.charAt(0)}</AvatarFallback>
                            </Avatar>
                          ))}
                        </div>
                      )}
                    </button>
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

