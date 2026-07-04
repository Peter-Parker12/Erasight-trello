"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Department, Objective } from "@prisma/client";

import { useAction } from "@/hooks/use-action";
import { createObjective } from "@/actions/create-objective";
import { updateObjective } from "@/actions/update-objective";
import { OrgMember } from "@/lib/org-members";
import { QUARTERS } from "@/constants/okr";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { OkrRoleClient } from "./okr-view";

const COMPANY = "__company__";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  objective: Objective | null;
  defaultDepartmentId: string | null;
  departments: Department[];
  members: OrgMember[];
  role: OkrRoleClient;
  quarter: number;
  year: number;
};

export const ObjectiveFormDialog = ({
  open,
  onOpenChange,
  objective,
  defaultDepartmentId,
  departments,
  members,
  role,
  quarter,
  year,
}: Props) => {
  const [title, setTitle] = useState("");
  const [departmentId, setDepartmentId] = useState<string>(COMPANY);
  const [ownerId, setOwnerId] = useState("");
  const [objQuarter, setObjQuarter] = useState(quarter);
  const [objYear, setObjYear] = useState(year);

  // Leaders can only create within departments they lead; admins anywhere.
  const departmentOptions = role.isAdmin
    ? departments
    : departments.filter((d) => role.ledDepartmentIds.includes(d.id));

  // reset the form each time the dialog opens (adjust-state-during-render pattern)
  const [prevOpen, setPrevOpen] = useState(false);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setTitle(objective?.title ?? "");
      setDepartmentId(
        objective
          ? objective.departmentId ?? COMPANY
          : defaultDepartmentId ?? (role.isAdmin ? COMPANY : departmentOptions[0]?.id ?? COMPANY)
      );
      setOwnerId(objective?.ownerId ?? "");
      setObjQuarter(objective?.quarter ?? quarter);
      setObjYear(objective?.year ?? year);
    }
  }

  const { execute: executeCreate, isLoading: creating } = useAction(createObjective, {
    onSuccess: () => {
      toast.success("Đã tạo mục tiêu | Objective created");
      onOpenChange(false);
    },
    onError: (error) => toast.error(error),
  });

  const { execute: executeUpdate, isLoading: updating } = useAction(updateObjective, {
    onSuccess: () => {
      toast.success("Đã cập nhật mục tiêu | Objective updated");
      onOpenChange(false);
    },
    onError: (error) => toast.error(error),
  });

  const isLoading = creating || updating;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !ownerId) return;
    if (objective) {
      // department move is intentionally not supported when editing
      executeUpdate({
        id: objective.id,
        title: title.trim(),
        ownerId,
        quarter: objQuarter,
        year: objYear,
      });
    } else {
      executeCreate({
        title: title.trim(),
        departmentId: departmentId === COMPANY ? null : departmentId,
        ownerId,
        quarter: objQuarter,
        year: objYear,
      });
    }
  };

  const selectClass =
    "w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring";

  const years: number[] = [];
  for (let y = year - 1; y <= year + 2; y++) years.push(y);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {objective
              ? "Sửa mục tiêu | Edit objective"
              : "Thêm mục tiêu | Add objective"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="obj-title">Mục tiêu | Objective</Label>
            <Textarea
              id="obj-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Ký 3 hợp đồng ECOM đầu tiên | e.g. Sign first 3 ECOM contracts"
              rows={2}
              required
            />
          </div>

          {!objective && (
            <div className="space-y-1.5">
              <Label htmlFor="obj-dept">Cấp | Level</Label>
              <select
                id="obj-dept"
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className={selectClass}
              >
                {role.isAdmin && (
                  <option value={COMPANY}>🏛 OKR Công ty | Company OKR</option>
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
            <Label htmlFor="obj-owner">Người chịu trách nhiệm | Owner</Label>
            <select
              id="obj-owner"
              value={ownerId}
              onChange={(e) => setOwnerId(e.target.value)}
              className={selectClass}
              required
            >
              <option value="">— Chọn | Select —</option>
              {members.map((member) => (
                <option key={member.userId} value={member.userId}>
                  {member.userName}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="obj-quarter">Quý | Quarter</Label>
              <select
                id="obj-quarter"
                value={objQuarter}
                onChange={(e) => setObjQuarter(Number(e.target.value))}
                className={selectClass}
              >
                {QUARTERS.map((q) => (
                  <option key={q} value={q}>
                    Quý {q} | Q{q}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="obj-year">Năm | Year</Label>
              <select
                id="obj-year"
                value={objYear}
                onChange={(e) => setObjYear(Number(e.target.value))}
                className={selectClass}
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-x-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Hủy | Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !title.trim() || !ownerId}>
              {objective ? "Lưu | Save" : "Tạo | Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
