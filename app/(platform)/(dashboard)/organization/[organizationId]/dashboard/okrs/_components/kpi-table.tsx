"use client";

import { Pencil, Trash2, TrendingDown, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { Kpi } from "@prisma/client";

import { useAction } from "@/hooks/use-action";
import { upsertKpiEntry } from "@/actions/upsert-kpi-entry";
import { deleteKpi } from "@/actions/delete-kpi";
import { computeKpiAchievement, formatPercent, getStatusBand } from "@/lib/okr-score";
import { MONTH_LABELS } from "@/constants/okr";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EditableValueCell } from "./editable-value-cell";
import type { KpiFull } from "./kpi-dashboard";

type Props = {
  kpis: KpiFull[];
  months: number[];
  year: number;
  currentMonth: number | null; // null when viewing another year
  canManage: boolean;
  onEdit: (kpi: Kpi) => void;
};

export const KpiTable = ({
  kpis,
  months,
  year,
  currentMonth,
  canManage,
  onEdit,
}: Props) => {
  const { execute: executeUpsert } = useAction(upsertKpiEntry, {
    onError: (error) => toast.error(error),
  });

  const { execute: executeDelete } = useAction(deleteKpi, {
    onSuccess: () => toast.success("Đã xóa KPI | Deleted"),
    onError: (error) => toast.error(error),
  });

  const onDelete = (kpi: Kpi) => {
    if (
      !window.confirm(
        `Xóa KPI "${kpi.name}" và toàn bộ dữ liệu theo tháng? | Delete this KPI and all monthly data?`
      )
    )
      return;
    executeDelete({ id: kpi.id });
  };

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="bg-[#242424]">
            <TableHead className="min-w-44">KPI</TableHead>
            {months.map((month) => (
              <TableHead key={month} className="text-center min-w-24">
                {MONTH_LABELS[month]}
              </TableHead>
            ))}
            {canManage && <TableHead className="w-20" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {kpis.map((kpi) => (
            <TableRow key={kpi.id}>
              <TableCell className="align-top">
                <div className="flex items-start gap-x-1.5">
                  {kpi.direction === "DECREASE" ? (
                    <TrendingDown className="h-3.5 w-3.5 mt-0.5 shrink-0 text-neutral-400" />
                  ) : (
                    <TrendingUp className="h-3.5 w-3.5 mt-0.5 shrink-0 text-neutral-400" />
                  )}
                  <div>
                    <p className="font-medium leading-snug">{kpi.name}</p>
                    {kpi.unit && (
                      <p className="text-xs text-neutral-400">{kpi.unit}</p>
                    )}
                  </div>
                </div>
              </TableCell>
              {months.map((month) => {
                const entry = kpi.entries.find(
                  (e) => e.month === month && e.year === year
                );
                const hasTarget = !!entry && entry.target !== null && entry.target > 0;
                const hasActual = !!entry && entry.actual !== null;
                const ratio =
                  hasTarget && hasActual
                    ? computeKpiAchievement(entry!.target!, entry!.actual!, kpi.direction)
                    : null;
                const band = ratio !== null ? getStatusBand(ratio) : null;
                // yellow: month has arrived (or passed), target set, actual missing
                const needsUpdate =
                  hasTarget &&
                  !hasActual &&
                  currentMonth !== null &&
                  month <= currentMonth;
                return (
                  <TableCell key={month} className="text-center align-top">
                    <div className="flex flex-col items-center gap-y-0.5">
                      <div className="flex items-center gap-x-1 text-xs text-neutral-400">
                        <span>KH|Plan</span>
                        <EditableValueCell
                          value={entry?.target ?? null}
                          canEdit={canManage}
                          onSave={(value) =>
                            executeUpsert({ kpiId: kpi.id, year, month, target: value })
                          }
                          className="w-14 text-center"
                        />
                      </div>
                      <div className="flex items-center gap-x-1 text-xs text-neutral-400">
                        <span>TT|Act</span>
                        <EditableValueCell
                          value={entry?.actual ?? null}
                          canEdit={canManage}
                          needsUpdate={needsUpdate}
                          onSave={(value) =>
                            executeUpsert({ kpiId: kpi.id, year, month, actual: value })
                          }
                          className="w-14 text-center"
                        />
                      </div>
                      {/* computed % — black text convention */}
                      {ratio !== null && band ? (
                        <span
                          className={`text-xs font-bold tabular-nums rounded px-1.5 py-px ${band.bgClass} ${band.textClass}`}
                        >
                          {band.emoji} {formatPercent(ratio)}
                        </span>
                      ) : (
                        <span className="text-xs text-neutral-300">—</span>
                      )}
                    </div>
                  </TableCell>
                );
              })}
              {canManage && (
                <TableCell className="align-top">
                  <div className="flex items-center justify-end gap-x-0.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-neutral-400 hover:text-[#e5e5e5]"
                      onClick={() => onEdit(kpi)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-neutral-400 hover:text-red-600"
                      onClick={() => onDelete(kpi)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
