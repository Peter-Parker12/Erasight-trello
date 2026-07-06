"use client";

import { useState } from "react";
import { Building2, Landmark, Plus } from "lucide-react";
import { Department, Kpi, KpiEntry } from "@prisma/client";

import { computeKpiAchievement, getStatusBand } from "@/lib/okr-score";
import { HALF_MONTHS } from "@/constants/okr";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Legend } from "./legend";
import { PeriodPicker } from "./period-picker";
import { KpiTable } from "./kpi-table";
import { KpiCharts } from "./kpi-charts";
import { KpiFormDialog } from "./kpi-form-dialog";
import { canManageDept, type OkrRoleClient } from "./okr-view";

export type KpiFull = Kpi & { entries: KpiEntry[] };

type Props = {
  organizationId: string;
  year: number;
  half: "H1" | "H2";
  departments: Department[];
  kpis: KpiFull[];
  role: OkrRoleClient;
};

export const KpiDashboard = ({
  organizationId,
  year,
  half,
  departments,
  kpis,
  role,
}: Props) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Kpi | null>(null);
  const [defaultDepartmentId, setDefaultDepartmentId] = useState<string | null>(null);

  const months = HALF_MONTHS[half];
  const now = new Date();
  const currentMonth =
    year === now.getFullYear() ? now.getMonth() + 1 : null;

  // Reference month for the "current status" tiles/bar chart: the current
  // month if it falls in the selected half, otherwise the half's last month.
  const focusMonth =
    currentMonth && months.includes(currentMonth)
      ? currentMonth
      : months[months.length - 1];

  const focusEntries = kpis
    .map((kpi) => {
      const entry = kpi.entries.find(
        (e) => e.month === focusMonth && e.actual !== null && e.target > 0
      );
      return entry
        ? {
            kpi,
            ratio: computeKpiAchievement(entry.target, entry.actual!, kpi.direction),
          }
        : null;
    })
    .filter(Boolean) as { kpi: KpiFull; ratio: number }[];

  const avgRatio =
    focusEntries.length > 0
      ? focusEntries.reduce((s, e) => s + e.ratio, 0) / focusEntries.length
      : null;
  const onTrackCount = focusEntries.filter((e) => e.ratio >= 0.7).length;
  const behindCount = focusEntries.filter((e) => e.ratio < 0.4).length;

  const openCreate = (departmentId: string | null) => {
    setEditing(null);
    setDefaultDepartmentId(departmentId);
    setDialogOpen(true);
  };

  const groups = [
    {
      key: "company",
      departmentId: null as string | null,
      name: "KPI Công ty | Company KPIs",
      color: null as string | null,
      items: kpis.filter((k) => k.departmentId === null),
    },
    ...departments.map((d) => ({
      key: d.id,
      departmentId: d.id as string | null,
      name: d.name,
      color: d.color,
      items: kpis.filter((k) => k.departmentId === d.id),
    })),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">
          KPI Dashboard — {half === "H1" ? "T1–T6" : "T7–T12"}/{year}
        </h2>
        <div className="flex items-center gap-x-2">
          <Legend />
          <PeriodPicker
            basePath={`/organization/${organizationId}/dashboard/okrs/kpis`}
            year={year}
            half={half}
          />
        </div>
      </div>

      {/* summary tiles for the focus month */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm text-neutral-500 font-medium">
              % đạt trung bình T{focusMonth} | Avg achievement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">
              {avgRatio === null ? "—" : `${Math.round(avgRatio * 100)}%`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm text-neutral-500 font-medium">
              ✅ Đúng tiến độ | On track
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">
              {onTrackCount}
              <span className="text-sm font-normal text-neutral-400">
                {" "}
                / {focusEntries.length} KPI
              </span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm text-neutral-500 font-medium">
              🔴 Chậm | Behind
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">
              {behindCount}
              <span className="text-sm font-normal text-neutral-400">
                {" "}
                / {focusEntries.length} KPI
              </span>
            </p>
          </CardContent>
        </Card>
      </div>

      <KpiCharts
        departments={departments}
        kpis={kpis}
        months={months}
        focusMonth={focusMonth}
      />

      {groups.map((group) => {
        const canManage = canManageDept(role, group.departmentId);
        if (group.items.length === 0 && !canManage) return null;
        const Icon = group.departmentId === null ? Landmark : Building2;
        return (
          <section key={group.key} className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h3 className="flex items-center gap-x-2 font-semibold text-[#e5e5e5]">
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
                  KPI
                </Button>
              )}
            </div>
            {group.items.length === 0 ? (
              <p className="text-sm text-neutral-400 pl-5">
                Chưa có KPI | No KPIs yet.
              </p>
            ) : (
              <KpiTable
                kpis={group.items}
                months={months}
                year={year}
                currentMonth={currentMonth}
                canManage={canManage}
                onEdit={(kpi) => {
                  setEditing(kpi);
                  setDefaultDepartmentId(kpi.departmentId);
                  setDialogOpen(true);
                }}
              />
            )}
          </section>
        );
      })}

      <KpiFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        kpi={editing}
        defaultDepartmentId={defaultDepartmentId}
        departments={departments}
        role={role}
      />
    </div>
  );
};
