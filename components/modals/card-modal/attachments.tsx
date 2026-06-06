"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Paperclip, Plus, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

import { CardWithFullDetail } from "@/types";
import { useAction } from "@/hooks/use-action";
import { createAttachment } from "@/actions/create-attachment";
import { deleteAttachment } from "@/actions/delete-attachment";
import { Button } from "@/components/ui/button";

type AttachmentsProps = { data: CardWithFullDetail };

export const Attachments = ({ data }: AttachmentsProps) => {
  const params = useParams();
  const boardId = params.boardId as string;
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["card", data.id] });

  const { execute: execCreate } = useAction(createAttachment, {
    onSuccess: () => { invalidate(); setShowForm(false); setName(""); setUrl(""); },
    onError: (e) => toast.error(e),
  });

  const { execute: execDelete } = useAction(deleteAttachment, {
    onSuccess: () => invalidate(),
    onError: (e) => toast.error(e),
  });

  if (data.attachments.length === 0 && !showForm) return null;

  return (
    <div className="flex items-start gap-x-3 w-full">
      <Paperclip className="h-5 w-5 mt-0.5 text-neutral-700 shrink-0" />
      <div className="w-full">
        <p className="font-semibold text-neutral-700 mb-2">Attachments</p>

        <div className="space-y-2 mb-3">
          {data.attachments.map((att) => (
            <div key={att.id} className="flex items-center gap-3 group p-2 rounded hover:bg-gray-50">
              <div className="w-10 h-8 bg-gray-200 rounded flex items-center justify-center shrink-0">
                <Paperclip className="h-4 w-4 text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <a
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-sky-700 hover:underline flex items-center gap-1 truncate"
                >
                  {att.name}
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
                <p className="text-xs text-muted-foreground">Added {format(new Date(att.createdAt), "MMM d, yyyy")}</p>
              </div>
              <button
                onClick={() => execDelete({ id: att.id, boardId })}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        {showForm ? (
          <div className="space-y-2 p-3 border rounded-md bg-gray-50">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Display name..."
              className="w-full text-sm border rounded p-2 focus:outline-none focus:ring-1 focus:ring-sky-500 bg-white"
            />
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="w-full text-sm border rounded p-2 focus:outline-none focus:ring-1 focus:ring-sky-500 bg-white"
            />
            <div className="flex gap-2">
              <Button size="sm" className="h-7 text-xs" onClick={() => {
                if (name.trim() && url.trim()) execCreate({ cardId: data.id, boardId, name: name.trim(), url: url.trim() });
              }}>Attach</Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setShowForm(false); setName(""); setUrl(""); }}>Cancel</Button>
            </div>
          </div>
        ) : (
          <Button
            variant="gray"
            size="inline"
            className="text-xs"
            onClick={() => setShowForm(true)}
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Add link
          </Button>
        )}
      </div>
    </div>
  );
};
