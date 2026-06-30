"use client";

import { useState } from "react";
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
  const [enabled, setEnabled] = useState(true);
  const [loadedConfig, setLoadedConfig] = useState<TelegramSettingsData["config"] | undefined>(undefined);

  if (data?.config && data.config !== loadedConfig) {
    setLoadedConfig(data.config);
    setBotToken(data.config.botToken);
    setChatId(data.config.chatId);
    setTopicId(data.config.topicId ?? "");
    setEnabled(data.config.enabled);
  }

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["telegram-settings", boardId] });

  const { execute: execSave, isLoading: isSaving } = useAction(updateTelegramConfig as any, {
    onSuccess: () => { toast.success("Telegram settings saved"); invalidate(); },
    onError: (e) => toast.error(e),
  });

  const { execute: execRemove, isLoading: isRemoving } = useAction(removeTelegramConfig as any, {
    onSuccess: () => {
      toast.success("Telegram bot unlinked");
      setBotToken(""); setChatId(""); setTopicId(""); setEnabled(true);
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
      enabled,
    } as any);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="transparent" className="h-auto w-auto p-2 text-white">
          <Send className="h-4 w-4 sm:mr-1" />
          <span className="hidden sm:inline text-sm">Telegram</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 max-w-[calc(100vw-1.5rem)] pt-3 pb-3 px-0" side="bottom" align="start">
        <div className="text-sm font-medium text-center text-[#e5e5e5] pb-2 px-3">
          Telegram Notifications
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
            Failed to load settings. Make sure the database schema is up to date (<code>prisma db push</code>).
          </div>
        ) : (
          <div className="space-y-2 px-3 text-sm">
            <p className="text-xs text-muted-foreground">
              Link a Telegram bot to this board to get notified about assignments, AI reviews, and due-date reminders.
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
