"use client";

import { Department } from "@prisma/client";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend as ChartLegend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { computeKpiAchievement, getStatusBand } from "@/lib/okr-score";
import { MONTH_LABELS } from "@/constants/okr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { KpiFull } from "./kpi-dashboard";

const COMPANY_SERIES = "Công ty | Company";
const COMPANY_COLOR = "#475569";

type Props = {
  departments: Department[];
  kpis: KpiFull[];
  months: number[];
  focusMonth: number;
};

const avgAchievementPercent = (kpis: KpiFull[], month: number): number | null => {
  const ratios = kpis
    .map((kpi) => {
      const entry = kpi.entries.find(
        (e) => e.month === month && e.actual !== null && e.target !== null && e.target > 0
      );
      return entry
        ? computeKpiAchievement(entry.target!, entry.actual!, kpi.direction)
        : null;
    })
    .filter((r): r is number => r !== null);
  if (ratios.length === 0) return null;
  return Math.round((ratios.reduce((s, r) => s + r, 0) / ratios.length) * 100);
};

export const KpiCharts = ({ departments, kpis, months, focusMonth }: Props) => {
  const companyKpis = kpis.filter((k) => k.departmentId === null);

  const series = [
    ...(companyKpis.length > 0
      ? [{ name: COMPANY_SERIES, color: COMPANY_COLOR, items: companyKpis }]
      : []),
    ...departments
      .map((d) => ({
        name: d.name,
        color: d.color ?? "#64748b",
        items: kpis.filter((k) => k.departmentId === d.id),
      }))
      .filter((s) => s.items.length > 0),
  ];

  const lineData = months.map((month) => {
    const row: Record<string, string | number | null> = {
      month: MONTH_LABELS[month],
    };
    for (const s of series) row[s.name] = avgAchievementPercent(s.items, month);
    return row;
  });

  const hasLineData = lineData.some((row) =>
    series.some((s) => row[s.name] !== null)
  );

  const barData = kpis
    .map((kpi) => {
      const entry = kpi.entries.find(
        (e) => e.month === focusMonth && e.actual !== null && e.target !== null && e.target > 0
      );
      if (!entry) return null;
      const percent = Math.round(
        computeKpiAchievement(entry.target!, entry.actual!, kpi.direction)! * 100
      );
      return {
        name: kpi.name.length > 32 ? `${kpi.name.slice(0, 32)}…` : kpi.name,
        percent,
        color: getStatusBand(percent / 100).chartColor,
      };
    })
    .filter(Boolean) as { name: string; percent: number; color: string }[];

  if (!hasLineData && barData.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      {hasLineData && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              % đạt KPI theo tháng | Monthly achievement by department
            </CardTitle>
          </CardHeader>
          <CardContent className="pl-0">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={lineData} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                />
                <YAxis
                  unit="%"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                  width={44}
                />
                <Tooltip
                  formatter={(value) => [`${value ?? "—"}%`]}
                  labelStyle={{ fontSize: 12, color: "hsl(var(--popover-foreground))" }}
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    color: "hsl(var(--popover-foreground))",
                  }}
                />
                <ChartLegend wrapperStyle={{ fontSize: 12 }} />
                <ReferenceLine
                  y={100}
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="4 4"
                  label={{ value: "100%", fontSize: 10, fill: "hsl(var(--muted-foreground))", position: "right" }}
                />
                {series.map((s) => (
                  <Line
                    key={s.name}
                    type="monotone"
                    dataKey={s.name}
                    stroke={s.color}
                    strokeWidth={2}
                    dot={{ r: 3.5, fill: s.color, strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                    connectNulls={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {barData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              % đạt từng KPI — T{focusMonth} | Per-KPI achievement
            </CardTitle>
          </CardHeader>
          <CardContent className="pl-0">
            <ResponsiveContainer
              width="100%"
              height={Math.max(180, barData.length * 34 + 40)}
            >
              <BarChart
                data={barData}
                layout="vertical"
                margin={{ top: 8, right: 40, bottom: 0, left: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis
                  type="number"
                  unit="%"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={150}
                  tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(value) => [`${value ?? "—"}%`, "Đạt | Achieved"]}
                  labelStyle={{ fontSize: 12, color: "hsl(var(--popover-foreground))" }}
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    color: "hsl(var(--popover-foreground))",
                  }}
                />
                <ReferenceLine x={100} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" />
                <Bar dataKey="percent" barSize={16} radius={[0, 4, 4, 0]}>
                  {barData.map((item) => (
                    <Cell key={item.name} fill={item.color} />
                  ))}
                  <LabelList
                    dataKey="percent"
                    position="right"
                    formatter={(value) => `${value}%`}
                    style={{ fontSize: 11, fill: "hsl(var(--foreground))", fontWeight: 600 }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
