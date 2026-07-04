"use client";

import { useState } from "react";
import { Building2, Pencil, Plus, Send, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Department, OrgTelegramConfig } from "@prisma/client";

import { useAction } from "@/hooks/use-action";
import { seedOkrDefaults } from "@/actions/seed-okr-defaults";
import { deleteDepartment } from "@/actions/delete-department";
import { OrgMember } from "@/lib/org-members";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DepartmentFormDialog } from "./department-form-dialog";
import { OrgTelegramDialog } from "./org-telegram-dialog";

type DepartmentWithCounts = Department & {
  _count: { objectives: number; kpis: number };
};

type Props = {
  departments: DepartmentWithCounts[];
  members: OrgMember[];
  telegramConfig: OrgTelegramConfig | null;
};

export const DepartmentsView = ({ departments, members, telegramConfig }: Props) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [telegramOpen, setTelegramOpen] = useState(false);

  const { execute: executeSeed, isLoading: seeding } = useAction(seedOkrDefaults, {
    onSuccess: (data) =>
      toast.success(`Đã tạo ${data.length} phòng ban mẫu | Created ${data.length} departments`),
    onError: (error) => toast.error(error),
  });

  const { execute: executeDelete } = useAction(deleteDepartment, {
    onSuccess: (data) => toast.success(`Đã xóa "${data.name}" | Deleted`),
    onError: (error) => toast.error(error),
  });

  const memberById = new Map(members.map((m) => [m.userId, m]));

  const onDelete = (department: DepartmentWithCounts) => {
    const hasData = department._count.objectives > 0 || department._count.kpis > 0;
    const message = hasData
      ? `Xóa "${department.name}" sẽ xóa toàn bộ ${department._count.objectives} OKR và ${department._count.kpis} KPI của phòng này. Tiếp tục? | Deleting will remove all its OKRs & KPIs. Continue?`
      : `Xóa phòng ban "${department.name}"? | Delete this department?`;
    if (!window.confirm(message)) return;
    executeDelete({ id: department.id });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold flex items-center gap-x-2">
          <Building2 className="h-5 w-5" />
          Phòng ban | Departments
        </h2>
        <div className="flex items-center gap-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTelegramOpen(true)}
          >
            <Send className="h-4 w-4 mr-1.5" />
            Telegram
            {telegramConfig?.enabled && (
              <span className="ml-1.5 h-2 w-2 rounded-full bg-emerald-500" />
            )}
          </Button>
          {departments.length === 0 && (
            <Button
              variant="outline"
              size="sm"
              disabled={seeding}
              onClick={() => executeSeed({})}
            >
              <Sparkles className="h-4 w-4 mr-1.5" />
              Tạo phòng ban mẫu | Seed defaults
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Thêm phòng ban | Add
          </Button>
        </div>
      </div>

      {departments.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-neutral-500">
          Chưa có phòng ban nào. Tạo phòng ban mẫu (ECOM Services, Remote Works,
          Education, Tech) hoặc thêm thủ công.
          <br />
          No departments yet. Seed the suggested defaults or add one manually.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Phòng ban | Department</TableHead>
              <TableHead>Leader</TableHead>
              <TableHead className="text-center">OKRs</TableHead>
              <TableHead className="text-center">KPIs</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {departments.map((department) => {
              const leader = department.leaderId
                ? memberById.get(department.leaderId)
                : undefined;
              return (
                <TableRow key={department.id}>
                  <TableCell>
                    <div className="flex items-center gap-x-2 font-medium">
                      <span
                        className="h-3 w-3 rounded-full shrink-0"
                        style={{ backgroundColor: department.color ?? "#94a3b8" }}
                      />
                      {department.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    {leader ? (
                      <div className="flex items-center gap-x-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={leader.userImage} />
                          <AvatarFallback>{leader.userName[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{leader.userName}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-neutral-400">
                        Chưa gán | Unassigned
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">{department._count.objectives}</TableCell>
                  <TableCell className="text-center">{department._count.kpis}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => {
                          setEditing(department);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        onClick={() => onDelete(department)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      <DepartmentFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        department={editing}
        members={members}
      />
      <OrgTelegramDialog
        open={telegramOpen}
        onOpenChange={setTelegramOpen}
        config={telegramConfig}
      />
    </div>
  );
};
