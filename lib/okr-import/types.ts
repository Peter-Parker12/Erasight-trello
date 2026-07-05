import { METRIC_DIRECTION } from "@prisma/client";

export type RowError = {
  sheet: string;
  row: number;
  message: string;
};

export type ParsedKpiEntry = {
  month: number;
  target: number | null;
  actual: number | null;
};

export type ParsedKpi = {
  departmentName: string | null; // null = company-level KPI
  name: string;
  unit: string | null;
  direction: METRIC_DIRECTION;
  monthlyEntries: ParsedKpiEntry[];
};

export type ParsedKeyResult = {
  title: string;
  targetValue: number;
  unit: string | null;
  direction: METRIC_DIRECTION;
};

export type ParsedObjective = {
  sheet: string;
  departmentName: string | null; // null = company-level objective
  title: string;
  ownerName: string;
  quarter: 3 | 4;
  keyResults: ParsedKeyResult[];
};

export type ParsedWorkbook = {
  departmentNames: string[];
  objectives: ParsedObjective[];
  kpis: ParsedKpi[];
  ownerNames: string[]; // distinct owner/leader names found across the workbook
  rowErrors: RowError[];
};

export type NameMapping = Record<string, string>; // ownerName -> Clerk userId

export type ImportCounts = {
  departments: number;
  objectives: number;
  keyResults: number;
  kpis: number;
  kpiEntries: number;
};

export type ImportPreview = {
  counts: ImportCounts;
  unresolvedOwnerNames: string[];
  ownerNameGuesses: Record<string, string | null>; // ownerName -> best-guess userId
  rowErrors: RowError[];
};
