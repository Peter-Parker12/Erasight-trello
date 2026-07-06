"use client";

import { useState } from "react";
import { toast } from "sonner";
import { KeyResult, METRIC_DIRECTION } from "@prisma/client";

import { useAction } from "@/hooks/use-action";
import { createKeyResult } from "@/actions/create-key-result";
import { updateKeyResult } from "@/actions/update-key-result";
import { cn } from "@/lib/utils";
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
  objectiveId: string;
  keyResult: KeyResult | null;
};

export const KeyResultFormDialog = ({
  open,
  onOpenChange,
  objectiveId,
  keyResult,
}: Props) => {
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");
  const [unit, setUnit] = useState("");
  const [direction, setDirection] = useState<METRIC_DIRECTION>("INCREASE");

  // reset the form each time the dialog opens (adjust-state-during-render pattern)
  const [prevOpen, setPrevOpen] = useState(false);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setTitle(keyResult?.title ?? "");
      setTarget(keyResult?.targetValue !== null && keyResult?.targetValue !== undefined
        ? String(keyResult.targetValue)
        : "");
      setUnit(keyResult?.unit ?? "");
      setDirection(keyResult?.direction ?? "INCREASE");
    }
  }

  const { execute: executeCreate, isLoading: creating } = useAction(createKeyResult, {
    onSuccess: () => {
      toast.success("Đã tạo Key Result | Created");
      onOpenChange(false);
    },
    onError: (error) => toast.error(error),
  });

  const { execute: executeUpdate, isLoading: updating } = useAction(updateKeyResult, {
    onSuccess: () => {
      toast.success("Đã cập nhật Key Result | Updated");
      onOpenChange(false);
    },
    onError: (error) => toast.error(error),
  });

  const isLoading = creating || updating;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Blank target is allowed — filled in later via the spreadsheet cell.
    const targetValue = target.trim() === "" ? null : Number(target);
    if (!title.trim() || Number.isNaN(targetValue)) return;
    if (keyResult) {
      executeUpdate({
        id: keyResult.id,
        title: title.trim(),
        targetValue,
        unit: unit.trim() || null,
        direction,
      });
    } else {
      executeCreate({
        objectiveId,
        title: title.trim(),
        targetValue,
        unit: unit.trim() || null,
        direction,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {keyResult ? "Sửa Key Result | Edit" : "Thêm Key Result | Add"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="kr-title">Key Result</Label>
            <Input
              id="kr-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Số hợp đồng ký mới | e.g. New contracts signed"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="kr-target">Target</Label>
              <Input
                id="kr-target"
                type="number"
                step="any"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="—"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="kr-unit">Đơn vị | Unit</Label>
              <Input
                id="kr-unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="%, VND, hợp đồng..."
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Hướng | Direction</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDirection("INCREASE")}
                className={cn(
                  "rounded-md border px-3 py-2 text-sm text-left transition",
                  direction === "INCREASE"
                    ? "border-primary bg-primary/5 font-medium"
                    : "border-input text-neutral-400 hover:bg-[#333]"
                )}
              >
                📈 Càng cao càng tốt
                <br />
                <span className="text-xs text-neutral-400">Higher is better</span>
              </button>
              <button
                type="button"
                onClick={() => setDirection("DECREASE")}
                className={cn(
                  "rounded-md border px-3 py-2 text-sm text-left transition",
                  direction === "DECREASE"
                    ? "border-primary bg-primary/5 font-medium"
                    : "border-input text-neutral-400 hover:bg-[#333]"
                )}
              >
                📉 Càng thấp càng tốt
                <br />
                <span className="text-xs text-neutral-400">Lower is better</span>
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-x-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Hủy | Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !title.trim()}>
              {keyResult ? "Lưu | Save" : "Tạo | Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
