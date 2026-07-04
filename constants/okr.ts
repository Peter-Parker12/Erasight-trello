// Static content and labels for the OKRs/KPIs module (bilingual VI | EN).

export const MONTH_LABELS: Record<number, string> = {
  1: "T1 | Jan",
  2: "T2 | Feb",
  3: "T3 | Mar",
  4: "T4 | Apr",
  5: "T5 | May",
  6: "T6 | Jun",
  7: "T7 | Jul",
  8: "T8 | Aug",
  9: "T9 | Sep",
  10: "T10 | Oct",
  11: "T11 | Nov",
  12: "T12 | Dec",
};

export const QUARTERS = [1, 2, 3, 4] as const;

export const quarterMonths = (quarter: number): number[] => {
  const start = (quarter - 1) * 3 + 1;
  return [start, start + 1, start + 2];
};

export const HALF_MONTHS: Record<"H1" | "H2", number[]> = {
  H1: [1, 2, 3, 4, 5, 6],
  H2: [7, 8, 9, 10, 11, 12],
};

export const SEED_DEPARTMENTS = [
  { name: "ECOM Services", color: "#0ea5e9" },
  { name: "Remote Works", color: "#8b5cf6" },
  { name: "Education", color: "#f59e0b" },
  { name: "Tech", color: "#10b981" },
];

export const CADENCE_ROWS = [
  {
    vi: "Thứ 2 hàng tuần (30')",
    en: "Weekly, Monday (30')",
    taskVi: "Leaders cập nhật KPI Dashboard, Paul review",
    taskEn: "Leaders update KPI Dashboard, admin reviews",
  },
  {
    vi: "Đầu mỗi tháng (60')",
    en: "Start of month (60')",
    taskVi: "OKR check-in: cập nhật cột Thực tế, nêu blocker",
    taskEn: "Monthly OKR check-in: update Actuals, raise blockers",
  },
  {
    vi: "Cuối quý (90')",
    en: "End of quarter (90')",
    taskVi: "Chấm điểm OKR, rút kinh nghiệm, đặt lại target",
    taskEn: "Grade OKRs, retro, reset targets",
  },
];

export const SCORING_ROWS = [
  {
    range: "0.7 – 1.0",
    emoji: "✅",
    vi: "Đúng tiến độ — OKR tốt là đạt ~0.7, đạt 1.0 liên tục nghĩa là target quá dễ",
    en: "On track — a good OKR lands ~0.7; hitting 1.0 repeatedly means targets are too easy",
  },
  {
    range: "0.4 – 0.69",
    emoji: "⚠️",
    vi: "Rủi ro — cần hành động điều chỉnh trong tuần",
    en: "At risk — corrective action needed this week",
  },
  {
    range: "0.0 – 0.39",
    emoji: "🔴",
    vi: "Chậm — leader phải trình phương án khắc phục",
    en: "Behind — leader must present a recovery plan",
  },
];

export const COLOR_LEGEND = [
  {
    swatchClass: "text-blue-600 font-semibold",
    sample: "123",
    vi: "Chữ xanh dương: số bạn nhập/chỉnh được (target, actual)",
    en: "Blue text: inputs you can edit",
  },
  {
    swatchClass: "text-foreground font-semibold",
    sample: "0.85",
    vi: "Chữ đen: công thức tự tính — không sửa",
    en: "Black text: computed — do not edit",
  },
  {
    swatchClass: "bg-yellow-100 px-1.5 rounded",
    sample: "—",
    vi: "Nền vàng: ô cần cập nhật kỳ này",
    en: "Yellow background: cells awaiting this period's update",
  },
];
