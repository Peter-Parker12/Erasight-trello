"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Send, X } from "lucide-react";
import { toast } from "sonner";
import { BoardTelegramConfig } from "@prisma/client";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { fetcher } from "@/lib/fetcher";
import { useAction } from "@/hooks/use-action";
import { updateTelegramConfig, removeTelegramConfig } from "@/actions/manage-telegram-config";

type TelegramSettingsData = {
  config: BoardTelegramConfig | null;
  lists: { id: string; title: string }[];
};

type TelegramSettingsProps = {
  boardId: string;
};

export const TelegramSettings = ({ boardId }: TelegramSettingsProps) => {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery<TelegramSettingsData>({
    queryKey: ["telegram-settings", boardId],
    queryFn: () => fetcher(`/api/boards/${boardId}/telegram`),
    enabled: open,
    retry: false,
  });

  const [botToken, setBotToken] = useState("");
  const [chatId, setChatId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [reviewListId, setReviewListId] = useState("");
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    if (data?.config) {
      setBotToken(data.config.botToken);
      setChatId(data.config.chatId);
      setTopicId(data.config.topicId ?? "");
      setReviewListId(data.config.reviewListId ?? "");
      setEnabled(data.config.enabled);
    }
  }, [data?.config]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["telegram-settings", boardId] });

  const { execute: execSave, isLoading: isSaving } = useAction(updateTelegramConfig as any, {
    onSuccess: () => { toast.success("Telegram settings saved"); invalidate(); },
    onError: (e) => toast.error(e),
  });

  const { execute: execRemove, isLoading: isRemoving } = useAction(removeTelegramConfig as any, {
    onSuccess: () => {
      toast.success("Telegram bot unlinked");
      setBotToken(""); setChatId(""); setTopicId(""); setReviewListId(""); setEnabled(true);
      invalidate();
    },
    onError: (e) => toast.error(e),
  });

  const onSave = () => {
    if (!botToken.trim() || !chatId.trim()) {
      toast.error("Bot token and chat ID are required");
      return;
    }
    execSave({
      boardId,
      botToken: botToken.trim(),
      chatId: chatId.trim(),
      topicId: topicId.trim() || null,
      reviewListId: reviewListId || null,
      enabled,
    } as any);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="transparent" className="h-auto w-auto p-2 text-white">
          <Send className="h-4 w-4 mr-1" />
          <span className="text-sm">Telegram</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 pt-3 pb-3 px-0" side="bottom" align="start">
        <div className="text-sm font-medium text-center text-neutral-600 pb-2 px-3">
          Telegram Notifications
        </div>
        <PopoverClose asChild>
          <Button className="h-auto w-auto p-2 absolute top-2 right-2 text-neutral-600" variant="ghost">
            <X className="h-4 w-4" />
          </Button>
        </PopoverClose>

        {isLoading ? (
          <div className="px-3 py-4 text-sm text-muted-foreground text-center">Loading...</div>
        ) : isError ? (
          <div className="px-3 py-4 text-sm text-red-500 text-center">
            Failed to load settings. Make sure the database schema is up to date (<code>prisma db push</code>).
          </div>
        ) : (
          <div className="space-y-2 px-3 text-sm">
            <p className="text-xs text-muted-foreground">
              Link a Telegram bot to this board to get notified about assignments, review requests, and due-date reminders.
            </p>

            <div>
              <label className="text-xs text-muted-foreground">Bot token</label>
              <input
                type="password"
                className="w-full border rounded p-1 text-xs mt-0.5"
                placeholder="123456:ABC-DEF..."
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Chat ID</label>
              <input
                className="w-full border rounded p-1 text-xs mt-0.5"
                placeholder="-1001234567890"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Topic ID (optional)</label>
              <input
                className="w-full border rounded p-1 text-xs mt-0.5"
                placeholder="message_thread_id"
                value={topicId}
                onChange={(e) => setTopicId(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground">List that triggers review notification</label>
              <select
                className="w-full border rounded p-1 text-xs mt-0.5 bg-white"
                value={reviewListId}
                onChange={(e) => setReviewListId(e.target.value)}
              >
                <option value="">— None —</option>
                {(data?.lists ?? []).map((l) => (
                  <option key={l.id} value={l.id}>{l.title}</option>
                ))}
              </select>
            </div>

            <label className="flex items-center gap-2 text-xs pt-1">
              <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
              Notifications enabled
            </label>

            <div className="flex gap-2 pt-2">
              <Button size="sm" className="h-7 text-xs flex-1" onClick={onSave} disabled={isSaving}>
                Save
              </Button>
              {data?.config && (
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-7 text-xs flex-1"
                  onClick={() => execRemove({ boardId } as any)}
                  disabled={isRemoving}
                >
                  Unlink bot
                </Button>
              )}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
