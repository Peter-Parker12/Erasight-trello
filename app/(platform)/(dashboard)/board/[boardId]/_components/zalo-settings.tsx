"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, X } from "lucide-react";
import { toast } from "sonner";
import { BoardZaloConfig } from "@prisma/client";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { fetcher } from "@/lib/fetcher";
import { useAction } from "@/hooks/use-action";
import { updateZaloConfig, removeZaloConfig } from "@/actions/manage-zalo-config";

type ZaloSettingsData = {
  config: BoardZaloConfig | null;
};

type ZaloSettingsProps = {
  boardId: string;
};

export const ZaloSettings = ({ boardId }: ZaloSettingsProps) => {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery<ZaloSettingsData>({
    queryKey: ["zalo-settings", boardId],
    queryFn: () => fetcher(`/api/boards/${boardId}/zalo`),
    enabled: open,
    retry: false,
  });

  const [botToken, setBotToken] = useState("");
  const [chatId, setChatId] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [loadedConfig, setLoadedConfig] = useState<ZaloSettingsData["config"] | undefined>(undefined);

  if (data?.config && data.config !== loadedConfig) {
    setLoadedConfig(data.config);
    setBotToken(data.config.botToken);
    setChatId(data.config.chatId);
    setEnabled(data.config.enabled);
  }

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["zalo-settings", boardId] });

  const { execute: execSave, isLoading: isSaving } = useAction(updateZaloConfig as any, {
    onSuccess: () => { toast.success("Zalo settings saved"); invalidate(); },
    onError: (e) => toast.error(e),
  });

  const { execute: execRemove, isLoading: isRemoving } = useAction(removeZaloConfig as any, {
    onSuccess: () => {
      toast.success("Zalo bot unlinked");
      setBotToken(""); setChatId(""); setEnabled(true);
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
      enabled,
    } as any);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="transparent" className="h-auto w-auto p-2 text-white">
          <MessageCircle className="h-4 w-4 sm:mr-1" />
          <span className="hidden sm:inline text-sm">Zalo</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 max-w-[calc(100vw-1.5rem)] pt-3 pb-3 px-0" side="bottom" align="start">
        <div className="text-sm font-medium text-center text-foreground pb-2 px-3">
          Zalo Notifications
        </div>
        <PopoverClose asChild>
          <Button className="h-auto w-auto p-2 absolute top-2 right-2 text-foreground" variant="ghost">
            <X className="h-4 w-4" />
          </Button>
        </PopoverClose>

        {isLoading ? (
          <div className="px-3 py-4 text-sm text-muted-foreground text-center">Loading...</div>
        ) : isError ? (
          <div className="px-3 py-4 text-sm text-destructive text-center">
            Failed to load settings. Make sure the database schema is up to date (<code>prisma db push</code>).
          </div>
        ) : (
          <div className="space-y-2 px-3 text-sm">
            <p className="text-xs text-muted-foreground">
              Link a Zalo bot (bot.zapps.me) to this board to get notified about assignments, AI reviews, and due-date reminders.
            </p>

            <div>
              <label className="text-xs text-muted-foreground">Bot token</label>
              <input
                type="password"
                className="w-full border border-border rounded p-1 text-xs mt-0.5 bg-background text-foreground"
                placeholder="From Zalo Bot Manager"
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Chat ID</label>
              <input
                className="w-full border border-border rounded p-1 text-xs mt-0.5 bg-background text-foreground"
                placeholder="message.chat.id from getUpdates"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Message the bot first, then call <code>getUpdates</code> on the bot token and copy <code>message.chat.id</code>.
              </p>
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
