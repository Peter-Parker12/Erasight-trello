"use client";

import { cn } from "@/lib/utils";
import { formatScore, getStatusBand } from "@/lib/okr-score";

type Props = {
  score: number | null;
  showScore?: boolean;
  className?: string;
};

export const ScoreBadge = ({ score, showScore = true, className }: Props) => {
  const band = getStatusBand(score);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-x-1 rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap",
        band.bgClass,
        band.textClass,
        className
      )}
    >
      {band.emoji}
      {showScore && <span>{formatScore(score)}</span>}
      <span className="hidden sm:inline">
        {band.labelVi} | {band.labelEn}
      </span>
    </span>
  );
};
