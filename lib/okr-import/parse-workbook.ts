import { read } from "xlsx";

import { parseKpiDashboardSheet } from "./parse-kpi-dashboard";
import { parseOkrSheet } from "./parse-okr-sheet";
import { ParsedWorkbook } from "./types";

// Matches company-level OKR sheets, e.g. "OKR Công ty" / "OKR Company".
const OKR_COMPANY_SHEET_RE = /^okr\s*c[oô]ng\s*ty$|^okr\s*company$/i;

// Matches any other OKR sheet and captures the department name portion,
// e.g. "OKR ECOM Services" -> "ECOM Services". The captured name is then
// resolved against the org's actual current departments (see
// resolveDepartmentSheet) rather than a hardcoded list, so renamed, new, or
// hierarchical departments are recognized without code changes.
const OKR_DEPARTMENT_SHEET_RE = /^okr\s+(.+)$/i;

const KPI_SHEET_RE = /^kpi\s*dashboard$/i;

const resolveDepartmentSheet = (
  trimmedName: string,
  departmentNames: string[]
): { matched: true; departmentName: string | null } | { matched: false; attemptedName?: string } => {
  if (OKR_COMPANY_SHEET_RE.test(trimmedName)) return { matched: true, departmentName: null };

  const deptMatch = trimmedName.match(OKR_DEPARTMENT_SHEET_RE);
  if (!deptMatch) return { matched: false };

  const attemptedName = deptMatch[1].trim();
  const found = departmentNames.find(
    (name) => name.trim().toLowerCase() === attemptedName.toLowerCase()
  );
  if (found) return { matched: true, departmentName: found };
  return { matched: false, attemptedName };
};

// `departmentNames` should be the org's current department names (e.g. from
// `db.department.findMany`), so custom/renamed/hierarchical departments are
// recognized just like the original seed set.
export const parseWorkbook = (buffer: Buffer, departmentNames: string[]): ParsedWorkbook => {
  const workbook = read(buffer, { type: "buffer" });

  const result: ParsedWorkbook = {
    departmentNames: [],
    objectives: [],
    kpis: [],
    ownerNames: [],
    rowErrors: [],
  };

  const foundDepartmentNames = new Set<string>();
  const ownerNames = new Set<string>();

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const trimmedName = sheetName.trim();

    const okrMatch = resolveDepartmentSheet(trimmedName, departmentNames);
    if (okrMatch.matched) {
      const { objectives, rowErrors } = parseOkrSheet(sheet, trimmedName, okrMatch.departmentName);
      result.objectives.push(...objectives);
      result.rowErrors.push(...rowErrors);
      if (okrMatch.departmentName) foundDepartmentNames.add(okrMatch.departmentName);
      objectives.forEach((o) => ownerNames.add(o.ownerName));
      continue;
    }
    if (!okrMatch.matched && okrMatch.attemptedName) {
      result.rowErrors.push({
        sheet: trimmedName,
        row: 0,
        message: `Sheet "${trimmedName}" doesn't match any department in this organization. Add the department first, or rename/remove this sheet.`,
      });
      continue;
    }

    if (KPI_SHEET_RE.test(trimmedName)) {
      const { kpis, rowErrors } = parseKpiDashboardSheet(sheet);
      result.kpis.push(...kpis);
      result.rowErrors.push(...rowErrors);
      kpis.forEach((k) => {
        if (k.departmentName) foundDepartmentNames.add(k.departmentName);
      });
      continue;
    }
    // Other sheets (Guide, Ownership Matrix) are intentionally not imported.
  }

  result.departmentNames = Array.from(foundDepartmentNames);
  result.ownerNames = Array.from(ownerNames);
  return result;
};
