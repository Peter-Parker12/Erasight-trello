"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, Pencil, Send, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAction } from "@/hooks/use-action";
import { adminSetTelegramAccount } from "@/actions/admin-set-telegram-account";

type MemberTelegramEditProps = {
  userId: string;
  telegramUsername: string | null;
  onSaved: () => void;
};

export const MemberTelegramEdit = ({
  userId,
  telegramUsername,
  onSaved,
}: MemberTelegramEditProps) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(telegramUsername ?? "");

  const { execute, isLoading } = useAction(adminSetTelegramAccount, {
    skipRefresh: true,
    onSuccess: () => {
      toast.success("Telegram username saved.");
      setEditing(false);
      onSaved();
    },
    onError: (error) => toast.error(error),
  });

  const save = () => {
    const trimmed = value.trim().replace(/^@+/, "");
    if (!trimmed) return;
    execute({ userId, telegramUsername: trimmed });
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <div className="relative">
          <Send className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") save();
              if (e.key === "Escape") setEditing(false);
            }}
            placeholder="telegram_username"
            className="h-7 w-40 pl-7 text-xs"
            disabled={isLoading}
          />
        </div>
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" disabled={isLoading} onClick={save}>
          <Check className="h-3.5 w-3.5" />
        </Button>
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditing(false)}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className={cn(
        "inline-flex items-center gap-1 text-xs rounded px-1.5 py-0.5 transition-colors",
        telegramUsername
          ? "text-muted-foreground hover:text-foreground hover:bg-muted"
          : "text-amber-400 bg-amber-500/10 hover:bg-amber-500/20"
      )}
    >
      <Send className="h-3 w-3" />
      {telegramUsername ? `@${telegramUsername}` : "Set Telegram"}
      <Pencil className="h-2.5 w-2.5 opacity-70" />
    </button>
  );
};
