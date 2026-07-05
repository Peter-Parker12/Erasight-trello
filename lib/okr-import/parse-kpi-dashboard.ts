import type { WorkSheet } from "xlsx";
import { utils } from "xlsx";
import { METRIC_DIRECTION } from "@prisma/client";

import { ParsedKpi, RowError } from "./types";

const SHEET_NAME = "KPI Dashboard";

// Bilingual "Label | Label" headers — match on either half so we're
// resilient to minor rewording between workbook versions.
const HEADER_ALIASES: Record<string, string[]> = {
  team: ["team"],
  kpi: ["kpi"],
  unit: ["đơn vị", "unit"],
  monthlyTarget: ["target/tháng", "monthly target"],
};

const MONTH_COLUMN_RE = /^t(\d{1,2})$/i;

const normalizeHeader = (h: unknown) =>
  String(h ?? "")
    .toLowerCase()
    .split("|")
    .map((s) => s.trim());

const findColumn = (headers: string[], aliases: string[]): number =>
  headers.findIndex((h) => normalizeHeader(h).some((part) => aliases.includes(part)));

const toNumber = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
};

export const parseKpiDashboardSheet = (
  sheet: WorkSheet
): { kpis: ParsedKpi[]; rowErrors: RowError[] } => {
  const rows: unknown[][] = utils.sheet_to_json(sheet, { header: 1, defval: null });
  const rowErrors: RowError[] = [];
  const kpis: ParsedKpi[] = [];

  const headerRowIndex = rows.findIndex(
    (row) => findColumn(row.map(String), HEADER_ALIASES.kpi) !== -1
  );
  if (headerRowIndex === -1) {
    return {
      kpis,
      rowErrors: [{ sheet: SHEET_NAME, row: 0, message: "Could not find header row." }],
    };
  }

  const headers = rows[headerRowIndex].map((h) => String(h ?? ""));
  const teamCol = findColumn(headers, HEADER_ALIASES.team);
  const kpiCol = findColumn(headers, HEADER_ALIASES.kpi);
  const unitCol = findColumn(headers, HEADER_ALIASES.unit);
  const targetCol = findColumn(headers, HEADER_ALIASES.monthlyTarget);

  const monthCols: { month: number; col: number }[] = [];
  headers.forEach((h, col) => {
    const parts = normalizeHeader(h);
    for (const part of parts) {
      const match = part.match(MONTH_COLUMN_RE);
      if (match) {
        monthCols.push({ month: parseInt(match[1], 10), col });
        break;
      }
    }
  });

  if (kpiCol === -1) {
    return {
      kpis,
      rowErrors: [{ sheet: SHEET_NAME, row: headerRowIndex + 1, message: "Missing KPI column." }],
    };
  }

  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.every((c) => c === null || c === "")) continue;

    const kpiName = String(row[kpiCol] ?? "").trim();
    if (!kpiName) continue;

    const teamName = teamCol !== -1 ? String(row[teamCol] ?? "").trim() : "";
    const unit = unitCol !== -1 ? String(row[unitCol] ?? "").trim() || null : null;
    const monthlyTarget = targetCol !== -1 ? toNumber(row[targetCol]) : null;

    const isCompanyLevel =
      !teamName || /^c[oô]ng ty|^company$/i.test(teamName);

    const monthlyEntries = monthCols.map(({ month, col }) => ({
      month,
      target: monthlyTarget,
      actual: toNumber(row[col]),
    }));

    kpis.push({
      departmentName: isCompanyLevel ? null : teamName,
      name: kpiName,
      unit,
      direction: METRIC_DIRECTION.INCREASE,
      monthlyEntries,
    });
  }

  return { kpis, rowErrors };
};
