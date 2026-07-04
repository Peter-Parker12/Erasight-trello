"use client";

import { useState } from "react";
import { Building2, Landmark, Plus } from "lucide-react";
import { Department, KeyResult, Objective, OkrCheckIn } from "@prisma/client";

import { OrgMember } from "@/lib/org-members";
import { Button } from "@/components/ui/button";
import { Legend } from "./legend";
import { PeriodPicker } from "./period-picker";
import { ObjectiveCard } from "./objective-card";
import { ObjectiveFormDialog } from "./objective-form-dialog";

export type ObjectiveFull = Objective & {
  keyResults: KeyResult[];
  checkIns: OkrCheckIn[];
};

export type OkrRoleClient = {
  isAdmin: boolean;
  ledDepartmentIds: string[];
};

export const canManageDept = (role: OkrRoleClient, departmentId: string | null) =>
  role.isAdmin || (!!departmentId && role.ledDepartmentIds.includes(departmentId));

type Props = {
  organizationId: string;
  quarter: number;
  year: number;
  departments: Department[];
  objectives: ObjectiveFull[];
  members: OrgMember[];
  role: OkrRoleClient;
};

export const OkrView = ({
  organizationId,
  quarter,
  year,
  departments,
  objectives,
  members,
  role,
}: Props) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Objective | null>(null);
  const [defaultDepartmentId, setDefaultDepartmentId] = useState<string | null>(null);

  const openCreate = (departmentId: string | null) => {
    setEditing(null);
    setDefaultDepartmentId(departmentId);
    setDialogOpen(true);
  };

  const openEdit = (objective: Objective) => {
    setEditing(objective);
    setDefaultDepartmentId(objective.departmentId);
    setDialogOpen(true);
  };

  const companyObjectives = objectives.filter((o) => o.departmentId === null);

  const groups: {
    key: string;
    departmentId: string | null;
    name: string;
    color: string | null;
    items: ObjectiveFull[];
  }[] = [
    {
      key: "company",
      departmentId: null,
      name: "OKR Công ty | Company OKRs",
      color: null,
      items: companyObjectives,
    },
    ...departments.map((d) => ({
      key: d.id,
      departmentId: d.id as string | null,
      name: d.name,
      color: d.color,
      items: objectives.filter((o) => o.departmentId === d.id),
    })),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">
          Mục tiêu quý | Quarterly OKRs
        </h2>
        <div className="flex items-center gap-x-2">
          <Legend />
          <PeriodPicker
            basePath={`/organization/${organizationId}/okrs`}
            quarter={quarter}
            year={year}
          />
        </div>
      </div>

      {departments.length === 0 && role.isAdmin && (
        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-neutral-500">
          Chưa có phòng ban. Vào tab &quot;Phòng ban | Departments&quot; để tạo trước.
          <br />
          No departments yet — set them up in the Departments tab first.
        </div>
      )}

      {groups.map((group) => {
        const canManage = canManageDept(role, group.departmentId);
        if (group.items.length === 0 && !canManage) return null;
        const Icon = group.departmentId === null ? Landmark : Building2;
        return (
          <section key={group.key} className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="flex items-center gap-x-2 font-semibold text-neutral-800">
                {group.color ? (
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: group.color }}
                  />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
                {group.name}
              </h3>
              {canManage && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openCreate(group.departmentId)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Mục tiêu | Objective
                </Button>
              )}
            </div>
            {group.items.length === 0 ? (
              <p className="text-sm text-neutral-400 pl-5">
                Chưa có mục tiêu cho Quý {quarter}/{year} | No objectives for Q{quarter} {year}.
              </p>
            ) : (
              <div className="space-y-3">
                {group.items.map((objective) => (
                  <ObjectiveCard
                    key={objective.id}
                    objective={objective}
                    members={members}
                    canManage={canManage}
                    onEdit={() => openEdit(objective)}
                  />
                ))}
              </div>
            )}
          </section>
        );
      })}

      <ObjectiveFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        objective={editing}
        defaultDepartmentId={defaultDepartmentId}
        departments={departments}
        members={members}
        role={role}
        quarter={quarter}
        year={year}
      />
    </div>
  );
};
