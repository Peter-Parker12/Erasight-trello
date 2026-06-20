"use client";

import { toast } from "sonner";
import { useState, useRef, ElementRef } from "react";
import { useParams } from "next/navigation";
import { useEventListener, useOnClickOutside } from "usehooks-ts";
import { AlignLeft, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

import { FormTextarea } from "@/components/form/form-textarea";
import { FormSubmit } from "@/components/form/form-submit";
import { useAction } from "@/hooks/use-action";
import { updateCard } from "@/actions/update-card";
import { CardWithList } from "@/types";

type DescriptionProps = {
  data: CardWithList;
};

export const Description = ({ data }: DescriptionProps) => {
  const queryClient = useQueryClient();
  const params = useParams();

  const [isEditing, setIsEditing] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const enableEditing = () => {
    setIsEditing(true);
    setTimeout(() => {
      textareaRef.current?.focus();
    });
  };

  const disableEditing = () => {
    setIsEditing(false);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      disableEditing();
    }
  };

  const onTextareaKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      formRef.current?.requestSubmit();
    }
  };

  const onClickOutside = () => {
    if (isSaving) return;
    formRef.current?.requestSubmit();
  };

  useEventListener("keydown", onKeyDown);
  useOnClickOutside(formRef as React.RefObject<HTMLElement>, onClickOutside);

  const { execute, fieldErrors, isLoading: isSaving } = useAction(updateCard, {
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["card", data.id],
      });

      queryClient.invalidateQueries({
        queryKey: ["card-logs", data.id],
      });

      toast.success(`Card "${data.title}" updated.`);
      disableEditing();
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  const onSubmit = (formData: FormData) => {
    const description = formData.get("description") as string;
    const boardId = params.boardId as string;

    execute({
      id: data.id,
      description,
      boardId,
    });
  };

  return (
    <div className="flex items-start gap-x-3 w-full">
      <AlignLeft className="h-5 w-5 mt-0.5 text-neutral-700" />
      <div className="w-full">
        <p className="font-semibold text-neutral-700 mb-2">Description</p>
        {isEditing ? (
          <form ref={formRef} action={onSubmit} className="space-y-2">
            <FormTextarea
              ref={textareaRef}
              id="description"
              className="w-full mt-2"
              placeholder="Add a more detailed description..."
              defaultValue={data.description || undefined}
              errors={fieldErrors}
              onKeyDown={onTextareaKeyDown}
            />

            <div className="flex items-center gap-x-2">
              <FormSubmit disabled={isSaving}>
                {isSaving ? (
                  <span className="flex items-center gap-1.5"><Loader2 className="h-3.5 w-3.5 animate-spin" />Saving...</span>
                ) : "Save"}
              </FormSubmit>
              <Button
                type="button"
                onClick={disableEditing}
                size="sm"
                variant="ghost"
                disabled={isSaving}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div
            onClick={enableEditing}
            role="button"
            className="min-h-[78px] bg-neutral-200 text-sm font-medium py-3 px-3.5 rounded-md"
          >
            {data.description ? (
              <div className="prose prose-sm max-w-none prose-p:my-0.5 prose-ul:my-0.5 prose-ol:my-0.5 prose-li:my-0 prose-headings:my-1 prose-code:bg-gray-300 prose-code:px-1 prose-code:rounded">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{data.description}</ReactMarkdown>
              </div>
            ) : (
              "Add a more detailed description..."
            )}
          </div>
        )}
      </div>
    </div>
  );
};

Description.Skeleton = function DescriptionSkeleton() {
  return (
    <div className="flex items-start gap-x-3 w-full">
      <Skeleton className="h-6 w-6 bg-neutral-200" />
      <div className="w-full">
        <Skeleton className="h-6 w-24 mb-2 bg-neutral-200" />
        <Skeleton className="h-[78px] w-full mb-2 bg-neutral-200" />
      </div>
    </div>
  );
};
