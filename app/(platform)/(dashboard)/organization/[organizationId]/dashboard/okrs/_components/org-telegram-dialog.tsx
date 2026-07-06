"use client";

import { useState } from "react";
import { toast } from "sonner";
import { OrgTelegramConfig } from "@prisma/client";

import { useAction } from "@/hooks/use-action";
import {
  updateOrgTelegramConfig,
  removeOrgTelegramConfig,
} from "@/actions/manage-org-telegram-config";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: OrgTelegramConfig | null;
};

export const OrgTelegramDialog = ({ open, onOpenChange, config }: Props) => {
  const [botToken, setBotToken] = useState("");
  const [chatId, setChatId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [enabled, setEnabled] = useState(true);

  // reset the form each time the dialog opens (adjust-state-during-render pattern)
  const [prevOpen, setPrevOpen] = useState(false);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setBotToken(config?.botToken ?? "");
      setChatId(config?.chatId ?? "");
      setTopicId(config?.topicId ?? "");
      setEnabled(config?.enabled ?? true);
    }
  }

  const { execute: executeUpdate, isLoading: saving } = useAction(
    updateOrgTelegramConfig,
    {
      onSuccess: () => {
        toast.success("Đã lưu cấu hình Telegram | Saved");
        onOpenChange(false);
      },
      onError: (error) => toast.error(error),
    }
  );

  const { execute: executeRemove, isLoading: removing } = useAction(
    removeOrgTelegramConfig,
    {
      onSuccess: () => {
        toast.success("Đã gỡ cấu hình Telegram | Removed");
        onOpenChange(false);
      },
      onError: (error) => toast.error(error),
    }
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!botToken.trim() || !chatId.trim()) return;
    executeUpdate({
      botToken: botToken.trim(),
      chatId: chatId.trim(),
      topicId: topicId.trim() || null,
      enabled,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nhắc OKR/KPI qua Telegram | Telegram reminders</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-neutral-400">
          Nhắc leader cập nhật KPI (thứ 2 hàng tuần) và check-in OKR (đầu tháng)
          vào nhóm Telegram của công ty. | Weekly KPI and monthly OKR check-in
          reminders posted to your company group.
        </p>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="tg-token">Bot token</Label>
            <Input
              id="tg-token"
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              placeholder="123456:ABC-DEF..."
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tg-chat">Chat ID</Label>
            <Input
              id="tg-chat"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              placeholder="-100123456789"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tg-topic">Topic ID (tùy chọn | optional)</Label>
            <Input
              id="tg-topic"
              value={topicId}
              onChange={(e) => setTopicId(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-x-2 text-sm">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="rounded border-gray-300"
            />
            Bật nhắc nhở | Enabled
          </label>

          <div className="flex items-center justify-between gap-x-2">
            {config ? (
              <Button
                type="button"
                variant="ghost"
                className="text-red-600 hover:text-red-700"
                disabled={removing}
                onClick={() => {
                  if (window.confirm("Gỡ cấu hình Telegram? | Remove config?")) {
                    executeRemove({});
                  }
                }}
              >
                Gỡ | Remove
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-x-2">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Hủy | Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving || !botToken.trim() || !chatId.trim()}
              >
                Lưu | Save
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
