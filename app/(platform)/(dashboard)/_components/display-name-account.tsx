"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, X } from "lucide-react";
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
import { updateDisplayName, removeDisplayName } from "@/actions/manage-display-name";

type DisplayNameData = {
  displayName: string | null;
};

export const DisplayNameAccount = () => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [loadedName, setLoadedName] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<DisplayNameData>({
    queryKey: ["display-name"],
    queryFn: () => fetcher("/api/display-name"),
    enabled: open,
  });

  if ((data?.displayName ?? null) !== loadedName) {
    setLoadedName(data?.displayName ?? null);
    setName(data?.displayName ?? "");
  }

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["display-name"] });

  const { execute: execSave, isLoading: isSaving } = useAction(updateDisplayName as any, {
    onSuccess: () => { toast.success("Display name saved"); invalidate(); },
    onError: (e) => toast.error(e),
  });

  const { execute: execRemove, isLoading: isRemoving } = useAction(removeDisplayName as any, {
    onSuccess: () => { toast.success("Display name removed"); setName(""); invalidate(); },
    onError: (e) => toast.error(e),
  });

  const onSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Enter a display name");
      return;
    }
    execSave({ displayName: trimmed } as any);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="h-auto w-auto p-2">
          <Pencil className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 max-w-[calc(100vw-1.5rem)] pt-3 pb-3 px-0" side="bottom" align="end">
        <div className="text-sm font-medium text-center text-foreground pb-2 px-3">
          My Display Name
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
              Set a display name to replace your account name in this organization. Useful if your account name is hard to read.
            </p>
            <div>
              <label className="text-xs text-muted-foreground">Display name</label>
              <input
                className="w-full border rounded p-1 text-xs mt-0.5"
                placeholder="Your name..."
                value={name}
                maxLength={50}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") onSave(); }}
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button size="sm" className="h-7 text-xs flex-1" onClick={onSave} disabled={isSaving}>
                Save
              </Button>
              {data?.displayName && (
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
