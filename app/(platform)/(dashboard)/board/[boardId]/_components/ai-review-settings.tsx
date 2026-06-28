"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { BoardAiConfig } from "@prisma/client";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { fetcher } from "@/lib/fetcher";

type AiSettingsData = {
  config: BoardAiConfig | null;
  lists: { id: string; title: string }[];
};

export const AiReviewSettings = ({ boardId }: { boardId: string }) => {
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery<AiSettingsData>({
    queryKey: ["ai-settings", boardId],
    queryFn: () => fetcher(`/api/boards/${boardId}/ai-config`),
    enabled: open,
    retry: false,
  });

  const [reviewListId, setReviewListId] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [loadedConfig, setLoadedConfig] = useState<BoardAiConfig | null | undefined>(undefined);

  if (data?.config !== undefined && data.config !== loadedConfig) {
    setLoadedConfig(data.config);
    setReviewListId(data.config?.reviewListId ?? "");
    setEnabled(data.config?.enabled ?? true);
  }

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["ai-settings", boardId] });

  const onSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/boards/${boardId}/ai-config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewListId: reviewListId || null, enabled }),
      });
      if (!res.ok) throw new Error();
      toast.success("AI Review settings saved");
      invalidate();
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const onRemove = async () => {
    setIsSaving(true);
    try {
      await fetch(`/api/boards/${boardId}/ai-config`, { method: "DELETE" });
      setReviewListId("");
      setEnabled(true);
      setLoadedConfig(null);
      toast.success("AI Review config removed");
      invalidate();
    } catch {
      toast.error("Failed to remove config");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="transparent" className="h-auto w-auto p-2 text-white">
          <Sparkles className="h-4 w-4 sm:mr-1" />
          <span className="hidden sm:inline text-sm">AI Review</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 max-w-[calc(100vw-1.5rem)] pt-3 pb-3 px-0" side="bottom" align="start">
        <div className="text-sm font-medium text-center text-[#e5e5e5] pb-2 px-3">
          AI Review Settings
        </div>
        <PopoverClose asChild>
          <Button className="h-auto w-auto p-2 absolute top-2 right-2 text-[#e5e5e5]" variant="ghost">
            <X className="h-4 w-4" />
          </Button>
        </PopoverClose>

        {isLoading ? (
          <div className="px-3 py-4 text-sm text-muted-foreground text-center">Loading...</div>
        ) : isError ? (
          <div className="px-3 py-4 text-sm text-red-500 text-center">
            Failed to load settings. Make sure the database schema is up to date.
          </div>
        ) : (
          <div className="space-y-3 px-3 text-sm">
            <p className="text-xs text-muted-foreground">
              When a card is dragged into the selected list, Claude will automatically review all its attachments and store feedback on each file.
            </p>

            <div>
              <label className="text-xs text-muted-foreground">List that triggers AI review</label>
              <select
                className="w-full border rounded p-1 text-xs mt-0.5 bg-[#2a2a2a] border-[#333] text-[#e5e5e5]"
                value={reviewListId}
                onChange={(e) => setReviewListId(e.target.value)}
              >
                <option value="">— None (disabled) —</option>
                {(data?.lists ?? []).map((l) => (
                  <option key={l.id} value={l.id}>{l.title}</option>
                ))}
              </select>
            </div>

            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
              Auto-review enabled
            </label>

            <div className="flex gap-2 pt-1">
              <Button size="sm" className="h-7 text-xs flex-1" onClick={onSave} disabled={isSaving}>
                Save
              </Button>
              {data?.config && (
                <Button size="sm" variant="destructive" className="h-7 text-xs flex-1" onClick={onRemove} disabled={isSaving}>
                  Remove
                </Button>
              )}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
