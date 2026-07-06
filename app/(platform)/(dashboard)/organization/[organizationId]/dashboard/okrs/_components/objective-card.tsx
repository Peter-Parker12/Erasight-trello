"use client";

import { useState } from "react";
import { CalendarCheck, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { useAction } from "@/hooks/use-action";
import { deleteObjective } from "@/actions/delete-objective";
import { OrgMember } from "@/lib/org-members";
import { computeObjectiveScore, formatScore, getStatusBand } from "@/lib/okr-score";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScoreBadge } from "./score-badge";
import { KeyResultRow } from "./key-result-row";
import { KeyResultFormDialog } from "./key-result-form-dialog";
import { CheckInDialog } from "./check-in-dialog";
import type { ObjectiveFull } from "./okr-view";
import { KeyResult } from "@prisma/client";

type Props = {
  objective: ObjectiveFull;
  members: OrgMember[];
  canManage: boolean;
  onEdit: () => void;
};

export const ObjectiveCard = ({ objective, members, canManage, onEdit }: Props) => {
  const [krDialogOpen, setKrDialogOpen] = useState(false);
  const [editingKr, setEditingKr] = useState<KeyResult | null>(null);
  const [checkInOpen, setCheckInOpen] = useState(false);

  const { execute: executeDelete } = useAction(deleteObjective, {
    onSuccess: () => toast.success("Đã xóa mục tiêu | Objective deleted"),
    onError: (error) => toast.error(error),
  });

  const score = computeObjectiveScore(objective.keyResults);
  const band = getStatusBand(score);
  const owner = members.find((m) => m.userId === objective.ownerId);

  const onDelete = () => {
    if (
      !window.confirm(
        `Xóa mục tiêu "${objective.title}" và toàn bộ Key Results? | Delete this objective and all its key results?`
      )
    )
      return;
    executeDelete({ id: objective.id });
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-semibold leading-snug">{objective.title}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-500">
              {owner && (
                <span className="flex items-center gap-x-1.5">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={owner.userImage} />
                    <AvatarFallback>{owner.userName[0]}</AvatarFallback>
                  </Avatar>
                  {owner.userName}
                </span>
              )}
              <span>
                {objective.keyResults.length} KR ·{" "}
                {objective.checkIns.length} check-in
              </span>
            </div>
          </div>
          <div className="flex items-center gap-x-1">
            <ScoreBadge score={score} />
            {canManage && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={onEdit}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                  onClick={onDelete}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
        {/* computed progress bar (black text convention: not editable) */}
        <div className="mt-2 flex items-center gap-x-2">
          <div className="h-2 flex-1 rounded-full bg-neutral-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${band.barClass}`}
              style={{ width: `${Math.round((score ?? 0) * 100)}%` }}
            />
          </div>
          <span className="text-xs font-semibold tabular-nums w-9 text-right">
            {formatScore(score)}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        {objective.keyResults.length > 0 && (
          <div className="hidden sm:grid grid-cols-[1fr_5.5rem_5.5rem_3.5rem_6rem_auto] gap-x-2 px-1 text-xs font-medium text-neutral-400">
            <span>Key Result</span>
            <span>Target</span>
            <span>Thực tế | Actual</span>
            <span>Đơn vị | Unit</span>
            <span className="text-right">Điểm | Score</span>
            <span />
          </div>
        )}
        {objective.keyResults.map((kr) => (
          <KeyResultRow
            key={kr.id}
            keyResult={kr}
            quarter={objective.quarter}
            year={objective.year}
            canManage={canManage}
            onEdit={() => {
              setEditingKr(kr);
              setKrDialogOpen(true);
            }}
          />
        ))}
        <div className="flex items-center gap-x-2 pt-2">
          {canManage && (
            <Button
              variant="ghost"
              size="sm"
              className="text-neutral-500"
              onClick={() => {
                setEditingKr(null);
                setKrDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Key Result
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="text-neutral-500"
            onClick={() => setCheckInOpen(true)}
          >
            <CalendarCheck className="h-4 w-4 mr-1" />
            Check-in
          </Button>
        </div>
      </CardContent>

      <KeyResultFormDialog
        open={krDialogOpen}
        onOpenChange={setKrDialogOpen}
        objectiveId={objective.id}
        keyResult={editingKr}
      />
      <CheckInDialog
        open={checkInOpen}
        onOpenChange={setCheckInOpen}
        objective={objective}
        canManage={canManage}
        currentScore={score}
      />
    </Card>
  );
};
