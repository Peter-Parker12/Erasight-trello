import { read } from "xlsx";

import { parseKpiDashboardSheet } from "./parse-kpi-dashboard";
import { parseOkrSheet } from "./parse-okr-sheet";
import { ParsedWorkbook } from "./types";

// Sheet name -> department name (null = company-level). Matched
// case-insensitively/trimmed since spreadsheet tab names can vary slightly.
const OKR_SHEET_DEPARTMENTS: { match: RegExp; departmentName: string | null }[] = [
  { match: /^okr\s*c[oô]ng\s*ty$/i, departmentName: null },
  { match: /^okr\s*ecom\s*services$/i, departmentName: "ECOM Services" },
  { match: /^okr\s*remote\s*works$/i, departmentName: "Remote Works" },
  { match: /^okr\s*education$/i, departmentName: "Education" },
  { match: /^okr\s*tech$/i, departmentName: "Tech" },
];

const KPI_SHEET_RE = /^kpi\s*dashboard$/i;

export const parseWorkbook = (buffer: Buffer): ParsedWorkbook => {
  const workbook = read(buffer, { type: "buffer" });

  const result: ParsedWorkbook = {
    departmentNames: [],
    objectives: [],
    kpis: [],
    ownerNames: [],
    rowErrors: [],
  };

  const departmentNames = new Set<string>();
  const ownerNames = new Set<string>();

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const trimmedName = sheetName.trim();

    const okrMatch = OKR_SHEET_DEPARTMENTS.find((m) => m.match.test(trimmedName));
    if (okrMatch) {
      const { objectives, rowErrors } = parseOkrSheet(sheet, trimmedName, okrMatch.departmentName);
      result.objectives.push(...objectives);
      result.rowErrors.push(...rowErrors);
      if (okrMatch.departmentName) departmentNames.add(okrMatch.departmentName);
      objectives.forEach((o) => ownerNames.add(o.ownerName));
      continue;
    }

    if (KPI_SHEET_RE.test(trimmedName)) {
      const { kpis, rowErrors } = parseKpiDashboardSheet(sheet);
      result.kpis.push(...kpis);
      result.rowErrors.push(...rowErrors);
      kpis.forEach((k) => {
        if (k.departmentName) departmentNames.add(k.departmentName);
      });
      continue;
    }
    // Other sheets (Guide, Ownership Matrix) are intentionally not imported.
  }

  result.departmentNames = Array.from(departmentNames);
  result.ownerNames = Array.from(ownerNames);
  return result;
};
