"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Department, Kpi, METRIC_DIRECTION } from "@prisma/client";

import { useAction } from "@/hooks/use-action";
import { createKpi } from "@/actions/create-kpi";
import { updateKpi } from "@/actions/update-kpi";
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
import type { OkrRoleClient } from "./okr-view";

const COMPANY = "__company__";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kpi: Kpi | null;
  defaultDepartmentId: string | null;
  departments: Department[];
  role: OkrRoleClient;
};

export const KpiFormDialog = ({
  open,
  onOpenChange,
  kpi,
  defaultDepartmentId,
  departments,
  role,
}: Props) => {
  const [name, setName] = useState("");
  const [departmentId, setDepartmentId] = useState<string>(COMPANY);
  const [unit, setUnit] = useState("");
  const [direction, setDirection] = useState<METRIC_DIRECTION>("INCREASE");

  const departmentOptions = role.isAdmin
    ? departments
    : departments.filter((d) => role.ledDepartmentIds.includes(d.id));

  // reset the form each time the dialog opens (adjust-state-during-render pattern)
  const [prevOpen, setPrevOpen] = useState(false);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setName(kpi?.name ?? "");
      setDepartmentId(
        kpi
          ? kpi.departmentId ?? COMPANY
          : defaultDepartmentId ??
              (role.isAdmin ? COMPANY : departmentOptions[0]?.id ?? COMPANY)
      );
      setUnit(kpi?.unit ?? "");
      setDirection(kpi?.direction ?? "INCREASE");
    }
  }

  const { execute: executeCreate, isLoading: creating } = useAction(createKpi, {
    onSuccess: () => {
      toast.success("Đã tạo KPI | Created");
      onOpenChange(false);
    },
    onError: (error) => toast.error(error),
  });

  const { execute: executeUpdate, isLoading: updating } = useAction(updateKpi, {
    onSuccess: () => {
      toast.success("Đã cập nhật KPI | Updated");
      onOpenChange(false);
    },
    onError: (error) => toast.error(error),
  });

  const isLoading = creating || updating;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (kpi) {
      executeUpdate({
        id: kpi.id,
        name: name.trim(),
        unit: unit.trim() || null,
        direction,
      });
    } else {
      executeCreate({
        name: name.trim(),
        departmentId: departmentId === COMPANY ? null : departmentId,
        unit: unit.trim() || null,
        direction,
      });
    }
  };

  const selectClass =
    "w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{kpi ? "Sửa KPI | Edit KPI" : "Thêm KPI | Add KPI"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="kpi-name">Tên KPI | Name</Label>
            <Input
              id="kpi-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Doanh thu tháng | e.g. Monthly revenue"
              required
            />
          </div>

          {!kpi && (
            <div className="space-y-1.5">
              <Label htmlFor="kpi-dept">Cấp | Level</Label>
              <select
                id="kpi-dept"
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className={selectClass}
              >
                {role.isAdmin && (
                  <option value={COMPANY}>🏛 KPI Công ty | Company KPI</option>
                )}
                {departmentOptions.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="kpi-unit">Đơn vị | Unit</Label>
            <Input
              id="kpi-unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="%, VND, học viên..."
            />
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
                    : "border-input text-neutral-500 hover:bg-neutral-50"
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
                    : "border-input text-neutral-500 hover:bg-neutral-50"
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
            <Button type="submit" disabled={isLoading || !name.trim()}>
              {kpi ? "Lưu | Save" : "Tạo | Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
