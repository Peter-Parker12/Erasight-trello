"use client";

import { ElementRef, useRef, useState } from "react";
import { toast } from "sonner";
import { useParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Circle, Layout } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";

import { FormInput } from "@/components/form/form-input";
import { useAction } from "@/hooks/use-action";
import { updateCard } from "@/actions/update-card";
import { toggleSubtaskComplete } from "@/actions/toggle-subtask-complete";
import { CardWithList } from "@/types";
import { cn } from "@/lib/utils";

type HeaderProps = {
  data: CardWithList;
};

export const Header = ({ data }: HeaderProps) => {
  const [title, setTitle] = useState(data.title);
  const queryClient = useQueryClient();
  const params = useParams();

  const { execute } = useAction(updateCard, {
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["card", data.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["card-logs", data.id],
      });

      toast.success(`Renamed to "${data.title}"`);
      setTitle(data.title);
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  const inputRef = useRef<ElementRef<"input">>(null);

  const onBlur = () => {
    inputRef.current?.form?.requestSubmit();
  };

  const onSubmit = (formData: FormData) => {
    const title = formData.get("title") as string;
    const boardId = params.boardId as string;

    if (title === data.title) return;

    execute({
      title,
      boardId,
      id: data.id,
    });
  };

  const { execute: execToggleComplete, isLoading: isToggling } = useAction(toggleSubtaskComplete, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["card", data.id] });
      queryClient.invalidateQueries({ queryKey: ["card", data.parentCardId] });
    },
    onError: (error) => toast.error(error),
  });

  const isSubtask = !!data.parentCardId;

  return (
    <div className="flex items-start gap-x-3 mb-6 w-full">
      <Layout className="h-5 w-5 mt-1 text-[#e5e5e5]" />
      <div className="w-full">
        <form action={onSubmit}>
          <FormInput
            id="title"
            onBlur={onBlur}
            ref={inputRef}
            defaultValue={title}
            className="font-semibold text-lg px-1 text-[#e5e5e5] bg-transparent border-transparent relative -left-1.5 w-full pr-8 focus-visible:bg-[#2a2a2a] focus-visible:border-input mb-0.5 truncate"
          />
        </form>
        <div className="flex items-center flex-wrap gap-x-3 gap-y-1">
          <p className="text-sm text-muted-foreground">
            <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded mr-1.5">#{data.cardNumber}</span>
            In list <span className="underline">{data.list.title}</span>
          </p>
          {isSubtask && (
            <button
              type="button"
              disabled={isToggling}
              onClick={() =>
                execToggleComplete({
                  id: data.id,
                  boardId: params.boardId as string,
                  completed: !data.completed,
                })
              }
              className={cn(
                "flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5 transition-colors",
                data.completed
                  ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                  : "bg-[#333] text-[#888] hover:bg-[#444] hover:text-[#e5e5e5]"
              )}
            >
              {data.completed ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
              {data.completed ? "Completed" : "Mark complete"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

Header.Skeleton = function HeaderSkeleton() {
  return (
    <div className="flex items-start gap-x-3 mb-6">
      <Skeleton className="h-6 w-6 mt-1 bg-[#333]" />
      <div>
        <Skeleton className="w-24 h-6 mb-1 bg-[#333]" />
        <Skeleton className="w-12 h-4 bg-[#333]" />
      </div>
    </div>
  );
};
