import { METRIC_DIRECTION } from "@prisma/client";

// Pure scoring helpers shared by server (actions, cron) and client (tables, badges).
// Scores are never persisted — always derived from target/actual.

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

// Returns null when either input is unset — a blank target/actual means "no
// data yet", which is not the same as a score of 0.
export const computeKrScore = (
  target: number | null,
  actual: number | null,
  direction: METRIC_DIRECTION
): number | null => {
  if (target === null || actual === null) return null;
  if (direction === "DECREASE") {
    // lower is better: hitting 0 (or below) is a perfect score
    if (actual <= 0) return 1;
    if (target <= 0) return 0;
    return clamp01(target / actual);
  }
  if (target <= 0) return 0;
  return clamp01(actual / target);
};

// Averages only the KRs that have both target and actual set. Returns null
// if none do (nothing measurable yet), rather than treating them as 0.
export const computeObjectiveScore = (
  krs: {
    targetValue: number | null;
    actualValue: number | null;
    direction: METRIC_DIRECTION;
  }[]
): number | null => {
  const scored = krs
    .map((kr) => computeKrScore(kr.targetValue, kr.actualValue, kr.direction))
    .filter((score): score is number => score !== null);
  if (scored.length === 0) return null;
  return scored.reduce((sum, score) => sum + score, 0) / scored.length;
};

// KPI monthly achievement uses the same math; returned as 0..1 (display as %)
export const computeKpiAchievement = computeKrScore;

export type StatusBandKey = "on_track" | "at_risk" | "behind" | "no_data";

export type StatusBand = {
  key: StatusBandKey;
  labelVi: string;
  labelEn: string;
  emoji: string;
  // tailwind classes
  textClass: string;
  bgClass: string;
  barClass: string;
  chartColor: string;
};

const BANDS: Record<StatusBandKey, StatusBand> = {
  on_track: {
    key: "on_track",
    labelVi: "Đúng tiến độ",
    labelEn: "On track",
    emoji: "✅",
    textClass: "text-emerald-700",
    bgClass: "bg-emerald-100",
    barClass: "bg-emerald-500",
    chartColor: "#10b981",
  },
  at_risk: {
    key: "at_risk",
    labelVi: "Rủi ro",
    labelEn: "At risk",
    emoji: "⚠️",
    textClass: "text-amber-700",
    bgClass: "bg-amber-100",
    barClass: "bg-amber-500",
    chartColor: "#f59e0b",
  },
  behind: {
    key: "behind",
    labelVi: "Chậm",
    labelEn: "Behind",
    emoji: "🔴",
    textClass: "text-red-700",
    bgClass: "bg-red-100",
    barClass: "bg-red-500",
    chartColor: "#ef4444",
  },
  no_data: {
    key: "no_data",
    labelVi: "Chưa có dữ liệu",
    labelEn: "No data",
    emoji: "➖",
    textClass: "text-neutral-400",
    bgClass: "bg-neutral-100",
    barClass: "bg-neutral-300",
    chartColor: "#9ca3af",
  },
};

// 0.7–1.0 on track | 0.4–0.69 at risk | 0.0–0.39 behind | null: no_data
export const getStatusBand = (score: number | null): StatusBand => {
  if (score === null) return BANDS.no_data;
  if (score >= 0.7) return BANDS.on_track;
  if (score >= 0.4) return BANDS.at_risk;
  return BANDS.behind;
};

export const formatScore = (score: number | null) => (score === null ? "—" : score.toFixed(2));

export const formatPercent = (ratio: number) => `${Math.round(ratio * 100)}%`;
