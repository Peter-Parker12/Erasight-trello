import { utils, write } from "xlsx";

// Header rows use the exact bilingual labels that parse-okr-sheet.ts and
// parse-kpi-dashboard.ts match on (case-insensitively, split on "|") — keep
// these in sync with HEADER_ALIASES in both of those files.
const OKR_HEADERS = ["ID", "Objective / Key Result", "Chủ trì | Owner", "Đơn vị | Unit", "Target Q3", "Target Q4"];

const KPI_HEADERS = [
  "Team",
  "KPI",
  "Đơn vị | Unit",
  "Target/tháng | Monthly Target",
  ...Array.from({ length: 12 }, (_, i) => `T${i + 1}`),
];

const buildOkrSheetRows = (): unknown[][] => [
  OKR_HEADERS,
  ["O1", "Ví dụ: Tăng doanh thu quý | Example: Grow quarterly revenue", "Nguyễn Văn A", "", "", ""],
  ["KR1.1", "Ví dụ: Chốt 10 hợp đồng mới | Example: Close 10 new contracts", "", "hợp đồng | contracts", 6, 10],
  ["KR1.2", "Ví dụ: Đạt NPS 8.5 | Example: Reach NPS 8.5", "", "điểm | points", 8, 8.5],
];

const buildKpiSheetRows = (): unknown[][] => [
  KPI_HEADERS,
  [
    "",
    "Ví dụ: Doanh thu tháng | Example: Monthly revenue",
    "triệu VND | million VND",
    500,
    ...Array.from({ length: 12 }, () => ""),
  ],
];

// Builds an .xlsx template matching the org's CURRENT departments — one
// "OKR <name>" sheet per department, plus the always-present "OKR Công ty"
// and "KPI Dashboard" sheets. Keep this in sync with parse-workbook.ts's
// sheet-name resolution, which matches "OKR <department name>" dynamically
// against the same department list.
export const generateOkrTemplate = (departments: { name: string }[]): Buffer => {
  const workbook = utils.book_new();

  const companySheet = utils.aoa_to_sheet(buildOkrSheetRows());
  utils.book_append_sheet(workbook, companySheet, "OKR Công ty");

  for (const department of departments) {
    // xlsx sheet names are capped at 31 characters and can't contain
    // : \ / ? * [ ]
    const safeName = `OKR ${department.name}`.replace(/[:\\/?*[\]]/g, " ").slice(0, 31);
    const sheet = utils.aoa_to_sheet(buildOkrSheetRows());
    utils.book_append_sheet(workbook, sheet, safeName);
  }

  const kpiSheet = utils.aoa_to_sheet(buildKpiSheetRows());
  utils.book_append_sheet(workbook, kpiSheet, "KPI Dashboard");

  return write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
};
