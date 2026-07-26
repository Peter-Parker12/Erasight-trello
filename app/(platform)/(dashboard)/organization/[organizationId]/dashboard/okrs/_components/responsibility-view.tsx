"use client";

import { CalendarClock, Landmark } from "lucide-react";
import { Department } from "@prisma/client";

import { OrgMember } from "@/lib/org-members";
import { CADENCE_ROWS, SCORING_ROWS } from "@/constants/okr";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Props = {
  departments: Department[];
  members: OrgMember[];
  objectiveCountMap: Record<string, number>;
  kpiCountMap: Record<string, number>;
  quarter: number;
  year: number;
};

export const ResponsibilityView = ({
  departments,
  members,
  objectiveCountMap,
  kpiCountMap,
  quarter,
  year,
}: Props) => {
  const memberById = new Map(members.map((m) => [m.userId, m]));
  const admins = members.filter((m) => m.role === "org:admin");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">
          Sơ đồ trách nhiệm | Responsibility chart
        </h2>
        <p className="text-sm text-muted-foreground">
          Ai làm gì, báo cáo cho ai, nhịp báo cáo | Who owns what, reporting
          lines &amp; cadence — Quý {quarter}/{year}
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Đơn vị | Unit</TableHead>
            <TableHead>Phụ trách | Owner</TableHead>
            <TableHead>Báo cáo cho | Reports to</TableHead>
            <TableHead className="text-center">OKRs (Q{quarter})</TableHead>
            <TableHead className="text-center">KPIs</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow className="bg-muted">
            <TableCell>
              <span className="flex items-center gap-x-2 font-semibold">
                <Landmark className="h-4 w-4" />
                Công ty | Company
              </span>
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap items-center gap-2">
                {admins.length === 0 ? (
                  <span className="text-sm text-muted-foreground">—</span>
                ) : (
                  admins.map((admin) => (
                    <span key={admin.userId} className="flex items-center gap-x-1.5 text-sm">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={admin.userImage} />
                        <AvatarFallback>{admin.userName[0]}</AvatarFallback>
                      </Avatar>
                      {admin.userName}
                    </span>
                  ))
                )}
              </div>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">—</TableCell>
            <TableCell className="text-center">
              {objectiveCountMap["company"] ?? 0}
            </TableCell>
            <TableCell className="text-center">{kpiCountMap["company"] ?? 0}</TableCell>
          </TableRow>
          {departments.map((department) => {
            const leader = department.leaderId
              ? memberById.get(department.leaderId)
              : undefined;
            return (
              <TableRow key={department.id}>
                <TableCell>
                  <span className="flex items-center gap-x-2 font-medium">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: department.color ?? "#94a3b8" }}
                    />
                    {department.name}
                  </span>
                </TableCell>
                <TableCell>
                  {leader ? (
                    <span className="flex items-center gap-x-1.5 text-sm">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={leader.userImage} />
                        <AvatarFallback>{leader.userName[0]}</AvatarFallback>
                      </Avatar>
                      {leader.userName}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Chưa gán | Unassigned
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  Admin ({admins.map((a) => a.userName).join(", ") || "—"})
                </TableCell>
                <TableCell className="text-center">
                  {objectiveCountMap[department.id] ?? 0}
                </TableCell>
                <TableCell className="text-center">
                  {kpiCountMap[department.id] ?? 0}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-x-2 text-base">
              <CalendarClock className="h-4 w-4" />
              Nhịp quản trị | Operating cadence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {CADENCE_ROWS.map((row) => (
                <li key={row.vi} className="text-sm">
                  <p className="font-semibold">
                    {row.vi} <span className="text-muted-foreground">| {row.en}</span>
                  </p>
                  <p className="text-foreground">{row.taskVi}</p>
                  <p className="text-muted-foreground">{row.taskEn}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Cách chấm điểm | Scoring
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {SCORING_ROWS.map((row) => (
                <li key={row.range} className="text-sm">
                  <p className="font-semibold font-mono">
                    {row.emoji} {row.range}
                  </p>
                  <p className="text-foreground">{row.vi}</p>
                  <p className="text-muted-foreground">{row.en}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground">
        Lưu ý: Mọi con số target là ĐỀ XUẤT khởi điểm — admin chốt lại với từng
        leader trong buổi kick-off. | All targets are PROPOSED starting points —
        finalize with each leader at kick-off.
      </p>
    </div>
  );
};
