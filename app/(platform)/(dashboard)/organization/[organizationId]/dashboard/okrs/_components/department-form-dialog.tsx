"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Department } from "@prisma/client";

import { useAction } from "@/hooks/use-action";
import { createDepartment } from "@/actions/create-department";
import { updateDepartment } from "@/actions/update-department";
import { OrgMember } from "@/lib/org-members";
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

const COLOR_OPTIONS = [
  "#0ea5e9",
  "#8b5cf6",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#ec4899",
  "#14b8a6",
  "#6366f1",
];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department: Department | null;
  members: OrgMember[];
};

export const DepartmentFormDialog = ({
  open,
  onOpenChange,
  department,
  members,
}: Props) => {
  const [name, setName] = useState("");
  const [leaderId, setLeaderId] = useState("");
  const [color, setColor] = useState<string>(COLOR_OPTIONS[0]);

  // reset the form each time the dialog opens (adjust-state-during-render pattern)
  const [prevOpen, setPrevOpen] = useState(false);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setName(department?.name ?? "");
      setLeaderId(department?.leaderId ?? "");
      setColor(department?.color ?? COLOR_OPTIONS[0]);
    }
  }

  const { execute: executeCreate, isLoading: creating } = useAction(createDepartment, {
    onSuccess: (data) => {
      toast.success(`Đã tạo "${data.name}" | Created`);
      onOpenChange(false);
    },
    onError: (error) => toast.error(error),
  });

  const { execute: executeUpdate, isLoading: updating } = useAction(updateDepartment, {
    onSuccess: (data) => {
      toast.success(`Đã cập nhật "${data.name}" | Updated`);
      onOpenChange(false);
    },
    onError: (error) => toast.error(error),
  });

  const isLoading = creating || updating;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (department) {
      executeUpdate({
        id: department.id,
        name: name.trim(),
        leaderId: leaderId || null,
        color,
      });
    } else {
      executeCreate({ name: name.trim(), leaderId: leaderId || null, color });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {department
              ? "Sửa phòng ban | Edit department"
              : "Thêm phòng ban | Add department"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="dept-name">Tên phòng ban | Name</Label>
            <Input
              id="dept-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: ECOM Services"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dept-leader">Leader</Label>
            <select
              id="dept-leader"
              value={leaderId}
              onChange={(e) => setLeaderId(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">— Chưa gán | Unassigned —</option>
              {members.map((member) => (
                <option key={member.userId} value={member.userId}>
                  {member.userName}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label>Màu | Color</Label>
            <div className="flex items-center gap-x-2">
              {COLOR_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setColor(option)}
                  className={cn(
                    "h-7 w-7 rounded-full border-2 border-transparent transition",
                    color === option && "border-white scale-110"
                  )}
                  style={{ backgroundColor: option }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-x-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Hủy | Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !name.trim()}>
              {department ? "Lưu | Save" : "Tạo | Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
