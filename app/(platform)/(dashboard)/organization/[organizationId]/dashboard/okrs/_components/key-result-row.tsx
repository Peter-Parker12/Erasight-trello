"use client";

import { Pencil, Trash2, TrendingDown, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { KeyResult } from "@prisma/client";

import { useAction } from "@/hooks/use-action";
import { updateKeyResult } from "@/actions/update-key-result";
import { deleteKeyResult } from "@/actions/delete-key-result";
import { computeKrScore, formatScore, getStatusBand } from "@/lib/okr-score";
import { Button } from "@/components/ui/button";
import { EditableValueCell } from "./editable-value-cell";

type Props = {
  keyResult: KeyResult;
  quarter: number;
  year: number;
  canManage: boolean;
  onEdit: () => void;
};

// A KR "needs update" (yellow cell) when we're inside its quarter and the
// actual hasn't been touched since the start of the current month.
const needsUpdate = (kr: KeyResult, quarter: number, year: number) => {
  const now = new Date();
  const currentQuarter = Math.floor(now.getMonth() / 3) + 1;
  if (year !== now.getFullYear() || quarter !== currentQuarter) return false;
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  return new Date(kr.updatedAt) < startOfMonth;
};

export const KeyResultRow = ({
  keyResult,
  quarter,
  year,
  canManage,
  onEdit,
}: Props) => {
  const { execute: executeUpdate } = useAction(updateKeyResult, {
    onError: (error) => toast.error(error),
  });

  const { execute: executeDelete } = useAction(deleteKeyResult, {
    onSuccess: () => toast.success("Đã xóa Key Result | Deleted"),
    onError: (error) => toast.error(error),
  });

  const score = computeKrScore(
    keyResult.targetValue,
    keyResult.actualValue,
    keyResult.direction
  );
  const band = getStatusBand(score);
  const pending = needsUpdate(keyResult, quarter, year);

  const onDelete = () => {
    if (!window.confirm(`Xóa "${keyResult.title}"? | Delete this key result?`)) return;
    executeDelete({ id: keyResult.id });
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-[1fr_5.5rem_5.5rem_3.5rem_6rem_auto] gap-x-2 gap-y-1 items-center rounded-md px-1 py-1.5 hover:bg-muted text-sm">
      <div className="col-span-2 sm:col-span-1 flex items-center gap-x-1.5 min-w-0">
        {keyResult.direction === "DECREASE" ? (
          <TrendingDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        ) : (
          <TrendingUp className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        )}
        <span className="truncate">{keyResult.title}</span>
      </div>
      <EditableValueCell
        value={keyResult.targetValue}
        canEdit={canManage}
        onSave={(value) => executeUpdate({ id: keyResult.id, targetValue: value })}
      />
      <EditableValueCell
        value={keyResult.actualValue}
        canEdit={canManage}
        needsUpdate={pending}
        onSave={(value) => executeUpdate({ id: keyResult.id, actualValue: value })}
      />
      <span className="text-muted-foreground text-xs">{keyResult.unit ?? ""}</span>
      {/* computed score — black text, not editable */}
      <span className="text-right font-semibold tabular-nums">
        {band.emoji} {formatScore(score)}
      </span>
      <div className="flex items-center justify-end gap-x-0.5">
        {canManage && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              onClick={onEdit}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
