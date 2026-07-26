"use client";

import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";

import { useAction } from "@/hooks/use-action";
import { createOkrCheckIn } from "@/actions/create-okr-check-in";
import { formatScore, getStatusBand } from "@/lib/okr-score";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ScoreBadge } from "./score-badge";
import type { ObjectiveFull } from "./okr-view";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  objective: ObjectiveFull;
  canManage: boolean;
  currentScore: number | null;
};

export const CheckInDialog = ({
  open,
  onOpenChange,
  objective,
  canManage,
  currentScore,
}: Props) => {
  const [note, setNote] = useState("");

  const { execute, isLoading } = useAction(createOkrCheckIn, {
    onSuccess: () => {
      toast.success("Đã ghi nhận check-in | Check-in recorded");
      setNote("");
    },
    onError: (error) => toast.error(error),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    execute({ objectiveId: objective.id, note: note.trim() || null });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Check-in OKR</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-md bg-card p-3 text-sm">
            <p className="font-medium leading-snug">{objective.title}</p>
            <div className="mt-2 flex items-center gap-x-2">
              <span className="text-muted-foreground">
                Điểm hiện tại | Current score:
              </span>
              <ScoreBadge score={currentScore} />
            </div>
          </div>

          {canManage && (
            <form onSubmit={onSubmit} className="space-y-2">
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ghi chú tiến độ, blocker... | Progress notes, blockers..."
                rows={3}
              />
              <div className="flex justify-end">
                <Button type="submit" size="sm" disabled={isLoading}>
                  Ghi nhận check-in | Record check-in
                </Button>
              </div>
            </form>
          )}

          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">
              Lịch sử | History ({objective.checkIns.length})
            </p>
            {objective.checkIns.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Chưa có check-in nào | No check-ins yet.
              </p>
            ) : (
              <ul className="max-h-56 space-y-2 overflow-y-auto pr-1">
                {objective.checkIns.map((checkIn) => {
                  const band = getStatusBand(checkIn.scoreAtCheckIn);
                  return (
                    <li key={checkIn.id} className="rounded-md border p-2.5 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">{checkIn.userName}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(checkIn.createdAt), "dd/MM/yyyy HH:mm")}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-x-2">
                        <span
                          className={`text-xs font-semibold ${band.textClass}`}
                        >
                          {band.emoji} {formatScore(checkIn.scoreAtCheckIn)}
                        </span>
                        {checkIn.note && (
                          <span className="text-foreground">{checkIn.note}</span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
