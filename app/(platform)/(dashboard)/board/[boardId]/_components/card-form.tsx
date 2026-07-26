"use client";

import { useRef, forwardRef, ElementRef, KeyboardEventHandler, useState } from "react";
import { toast } from "sonner";
import { useParams } from "next/navigation";
import { useOnClickOutside, useEventListener } from "usehooks-ts";
import { Plus, X, LayoutTemplate } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { CardTemplate } from "@prisma/client";

import { Button } from "@/components/ui/button";

import { FormTextarea } from "@/components/form/form-textarea";
import { FormSubmit } from "@/components/form/form-submit";
import { useAction } from "@/hooks/use-action";
import { createCard } from "@/actions/create-card";
import { fetcher } from "@/lib/fetcher";
import { useCardModal } from "@/hooks/use-card-modal";

type CardFormProps = {
  listId: string;
  enableEditing: () => void;
  disableEditing: () => void;
  isEditing: boolean;
};

export const CardForm = forwardRef<HTMLTextAreaElement, CardFormProps>(
  ({ listId, enableEditing, disableEditing, isEditing }, ref) => {
    const params = useParams();
    const formRef = useRef<HTMLFormElement>(null);
    const [showTemplates, setShowTemplates] = useState(false);
    const textareaRef = ref as React.RefObject<HTMLTextAreaElement>;
    const cardModal = useCardModal();

    const { data: templates } = useQuery<CardTemplate[]>({
      queryKey: ["org-templates"],
      queryFn: () => fetcher("/api/orgs/templates"),
      enabled: isEditing,
    });

    const { execute, fieldErrors } = useAction(createCard, {
      onSuccess: (data) => {
        toast.success(`Card "${data.title}" created.`);
        formRef.current?.reset();
        cardModal.onOpen(data.id);
      },
      onError: (error) => {
        toast.error(error);
      },
    });

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        disableEditing();
      }
    };

    const onSubmit = (formData: FormData) => {
      const title = formData.get("title") as string;
      const listId = formData.get("listId") as string;
      const boardId = formData.get("boardId") as string;

      execute({ title, listId, boardId });
    };

    useOnClickOutside(formRef as React.RefObject<HTMLElement>, () => {
      setShowTemplates(false);
      disableEditing();
    });
    useEventListener("keydown", onKeyDown);

    const onTextareaKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = (
      e,
    ) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        formRef.current?.requestSubmit();
      }
    };

    const applyTemplate = (template: CardTemplate) => {
      if (textareaRef?.current) {
        textareaRef.current.value = template.title;
      }
      setShowTemplates(false);
      // Dispatch input event so React sees the change
      textareaRef?.current?.dispatchEvent(new Event("input", { bubbles: true }));
    };

    if (isEditing) {
      return (
        <form
          ref={formRef}
          action={onSubmit}
          className="m-1 py-0.5 px-1 space-y-4"
        >
          <FormTextarea
            id="title"
            onKeyDown={onTextareaKeyDown}
            errors={fieldErrors}
            ref={ref}
            placeholder="Enter a title for this card..."
          />

          <input hidden id="listId" name="listId" value={listId} />
          <input hidden id="boardId" name="boardId" value={params.boardId} />

          {/* Template picker */}
          {templates && templates.length > 0 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowTemplates((v) => !v)}
                className="flex items-center gap-1 text-xs text-violet-400 hover:underline"
              >
                <LayoutTemplate className="h-3 w-3" /> Dùng template
              </button>
              {showTemplates && (
                <div className="absolute z-50 bottom-full mb-1 bg-popover border border-border rounded w-56 max-h-48 overflow-y-auto text-sm">
                  {templates.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => applyTemplate(t)}
                      className="w-full text-left px-3 py-2 hover:bg-secondary border-b border-border last:border-b-0 truncate text-foreground"
                    >
                      {t.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-x-1">
            <FormSubmit>Add card</FormSubmit>
            <Button onClick={disableEditing} size="sm" variant="ghost">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </form>
      );
    }

    return (
      <div className="pt-2 px-2">
        <Button
          onClick={enableEditing}
          className="h-auto px-2 py-1.5 w-full justify-start text-muted-foreground text-sm"
          size="sm"
          variant="ghost"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add a card
        </Button>
      </div>
    );
  },
);

CardForm.displayName = "CardForm";
