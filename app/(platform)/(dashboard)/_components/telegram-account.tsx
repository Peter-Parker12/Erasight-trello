"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Send, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { fetcher } from "@/lib/fetcher";
import { useAction } from "@/hooks/use-action";
import { updateTelegramAccount, removeTelegramAccount } from "@/actions/manage-telegram-account";

type TelegramAccountData = {
  telegramUsername: string | null;
};

export const TelegramAccount = () => {
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [loadedUsername, setLoadedUsername] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<TelegramAccountData>({
    queryKey: ["telegram-account"],
    queryFn: () => fetcher("/api/telegram-account"),
    enabled: open,
  });

  if ((data?.telegramUsername ?? null) !== loadedUsername) {
    setLoadedUsername(data?.telegramUsername ?? null);
    setUsername(data?.telegramUsername ?? "");
  }

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["telegram-account"] });

  const { execute: execSave, isLoading: isSaving } = useAction(updateTelegramAccount as any, {
    onSuccess: () => { toast.success("Telegram username saved"); invalidate(); },
    onError: (e) => toast.error(e),
  });

  const { execute: execRemove, isLoading: isRemoving } = useAction(removeTelegramAccount as any, {
    onSuccess: () => { toast.success("Telegram username removed"); setUsername(""); invalidate(); },
    onError: (e) => toast.error(e),
  });

  const onSave = () => {
    const trimmed = username.trim().replace(/^@/, "");
    if (!trimmed) {
      toast.error("Enter a Telegram username");
      return;
    }
    execSave({ telegramUsername: trimmed } as any);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="h-auto w-auto p-2">
          <Send className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 max-w-[calc(100vw-1.5rem)] pt-3 pb-3 px-0" side="bottom" align="end">
        <div className="text-sm font-medium text-center text-neutral-600 pb-2 px-3">
          My Telegram
        </div>
        <PopoverClose asChild>
          <Button className="h-auto w-auto p-2 absolute top-2 right-2 text-neutral-600" variant="ghost">
            <X className="h-4 w-4" />
          </Button>
        </PopoverClose>

        {isLoading ? (
          <div className="px-3 py-4 text-sm text-muted-foreground text-center">Loading...</div>
        ) : (
          <div className="space-y-2 px-3 text-sm">
            <p className="text-xs text-muted-foreground">
              Set your Telegram username so boards can tag you when a task is assigned to you.
            </p>
            <div>
              <label className="text-xs text-muted-foreground">Telegram username</label>
              <input
                className="w-full border rounded p-1 text-xs mt-0.5"
                placeholder="username (without @)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button size="sm" className="h-7 text-xs flex-1" onClick={onSave} disabled={isSaving}>
                Save
              </Button>
              {data?.telegramUsername && (
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-7 text-xs flex-1"
                  onClick={() => execRemove({} as any)}
                  disabled={isRemoving}
                >
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
