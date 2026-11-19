"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, X } from "lucide-react";
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
import { updateZaloAccount, removeZaloAccount } from "@/actions/manage-zalo-account";

type ZaloAccountData = {
  zaloName: string | null;
};

export const ZaloAccount = () => {
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [loadedUsername, setLoadedUsername] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<ZaloAccountData>({
    queryKey: ["zalo-account"],
    queryFn: () => fetcher("/api/zalo-account"),
    enabled: open,
  });

  if ((data?.zaloName ?? null) !== loadedUsername) {
    setLoadedUsername(data?.zaloName ?? null);
    setUsername(data?.zaloName ?? "");
  }

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["zalo-account"] });

  const { execute: execSave, isLoading: isSaving } = useAction(updateZaloAccount as any, {
    onSuccess: () => { toast.success("Zalo name saved"); invalidate(); },
    onError: (e) => toast.error(e),
  });

  const { execute: execRemove, isLoading: isRemoving } = useAction(removeZaloAccount as any, {
    onSuccess: () => { toast.success("Zalo name removed"); setUsername(""); invalidate(); },
    onError: (e) => toast.error(e),
  });

  const onSave = () => {
    const trimmed = username.trim().replace(/^@+/, "");
    if (!trimmed) {
      toast.error("Enter your Zalo name");
      return;
    }
    execSave({ zaloName: trimmed } as any);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="h-auto w-auto p-2">
          <MessageCircle className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 max-w-[calc(100vw-1.5rem)] pt-3 pb-3 px-0" side="bottom" align="end">
        <div className="text-sm font-medium text-center text-foreground pb-2 px-3">
          My Zalo
        </div>
        <PopoverClose asChild>
          <Button className="h-auto w-auto p-2 absolute top-2 right-2 text-foreground" variant="ghost">
            <X className="h-4 w-4" />
          </Button>
        </PopoverClose>

        {isLoading ? (
          <div className="px-3 py-4 text-sm text-muted-foreground text-center">Loading...</div>
        ) : (
          <div className="space-y-2 px-3 text-sm">
            <p className="text-xs text-muted-foreground">
              Set your Zalo display name so board notifications show @you when a task is assigned to you. (Zalo bots can&apos;t ping you — this is a visual tag only.)
            </p>
            <div>
              <label className="text-xs text-muted-foreground">Zalo display name</label>
              <input
                className="w-full border border-border rounded p-1 text-xs mt-0.5 bg-background text-foreground"
                placeholder="e.g. Nguyen Van A"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button size="sm" className="h-7 text-xs flex-1" onClick={onSave} disabled={isSaving}>
                Save
              </Button>
              {data?.zaloName && (
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
