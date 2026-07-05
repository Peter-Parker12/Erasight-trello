import type { WorkSheet } from "xlsx";
import { utils } from "xlsx";
import { METRIC_DIRECTION } from "@prisma/client";

import { ParsedKeyResult, ParsedObjective, RowError } from "./types";

const HEADER_ALIASES: Record<string, string[]> = {
  id: ["id"],
  title: ["objective / key result", "objective/key result"],
  owner: ["chủ trì", "owner"],
  unit: ["đơn vị", "unit"],
  targetQ3: ["target q3"],
  targetQ4: ["target q4"],
};

const OBJECTIVE_ID_RE = /^o(\d+)$/i;
const KEY_RESULT_ID_RE = /^kr(\d+)\.(\d+)$/i;

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

const inferDirection = (unit: string | null): METRIC_DIRECTION =>
  unit && /nghịch|reverse/i.test(unit) ? METRIC_DIRECTION.DECREASE : METRIC_DIRECTION.INCREASE;

type RawKeyResultRow = {
  title: string;
  owner: string;
  unit: string | null;
  targetQ3: number | null;
  targetQ4: number | null;
};

type RawObjectiveRow = {
  objectiveNum: string;
  title: string;
  owner: string;
  keyResults: RawKeyResultRow[];
};

export const parseOkrSheet = (
  sheet: WorkSheet,
  sheetName: string,
  departmentName: string | null
): { objectives: ParsedObjective[]; rowErrors: RowError[] } => {
  const rows: unknown[][] = utils.sheet_to_json(sheet, { header: 1, defval: null });
  const rowErrors: RowError[] = [];

  const headerRowIndex = rows.findIndex(
    (row) => findColumn(row.map(String), HEADER_ALIASES.id) !== -1
  );
  if (headerRowIndex === -1) {
    return {
      objectives: [],
      rowErrors: [{ sheet: sheetName, row: 0, message: "Could not find header row." }],
    };
  }

  const headers = rows[headerRowIndex].map((h) => String(h ?? ""));
  const idCol = findColumn(headers, HEADER_ALIASES.id);
  const titleCol = findColumn(headers, HEADER_ALIASES.title);
  const ownerCol = findColumn(headers, HEADER_ALIASES.owner);
  const unitCol = findColumn(headers, HEADER_ALIASES.unit);
  const targetQ3Col = findColumn(headers, HEADER_ALIASES.targetQ3);
  const targetQ4Col = findColumn(headers, HEADER_ALIASES.targetQ4);

  const rawObjectives: RawObjectiveRow[] = [];
  let current: RawObjectiveRow | null = null;

  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.every((c) => c === null || c === "")) continue;

    const id = String(row[idCol] ?? "").trim();
    const title = titleCol !== -1 ? String(row[titleCol] ?? "").trim() : "";
    if (!id || !title) continue;

    const objMatch = id.match(OBJECTIVE_ID_RE);
    const krMatch = id.match(KEY_RESULT_ID_RE);

    if (objMatch) {
      current = {
        objectiveNum: objMatch[1],
        title,
        owner: ownerCol !== -1 ? String(row[ownerCol] ?? "").trim() : "",
        keyResults: [],
      };
      rawObjectives.push(current);
      continue;
    }

    if (krMatch) {
      if (!current || current.objectiveNum !== krMatch[1]) {
        rowErrors.push({
          sheet: sheetName,
          row: i + 1,
          message: `Key result "${id}" found without a preceding matching objective row.`,
        });
        continue;
      }
      current.keyResults.push({
        title,
        owner: ownerCol !== -1 ? String(row[ownerCol] ?? "").trim() : "",
        unit: unitCol !== -1 ? String(row[unitCol] ?? "").trim() || null : null,
        targetQ3: targetQ3Col !== -1 ? toNumber(row[targetQ3Col]) : null,
        targetQ4: targetQ4Col !== -1 ? toNumber(row[targetQ4Col]) : null,
      });
    }
  }

  const objectives: ParsedObjective[] = [];

  for (const raw of rawObjectives) {
    if (!raw.owner) {
      rowErrors.push({
        sheet: sheetName,
        row: 0,
        message: `Objective "${raw.title}" has no owner and was skipped.`,
      });
      continue;
    }

    for (const quarter of [3, 4] as const) {
      const keyResults: ParsedKeyResult[] = raw.keyResults
        .map((kr) => {
          const targetValue = quarter === 3 ? kr.targetQ3 : kr.targetQ4;
          if (targetValue === null) return null;
          return {
            title: kr.title,
            targetValue,
            unit: kr.unit,
            direction: inferDirection(kr.unit),
          };
        })
        .filter((kr): kr is ParsedKeyResult => kr !== null);

      if (keyResults.length === 0) continue;

      objectives.push({
        sheet: sheetName,
        departmentName,
        title: raw.title,
        ownerName: raw.owner,
        quarter,
        keyResults,
      });
    }
  }

  return { objectives, rowErrors };
};
