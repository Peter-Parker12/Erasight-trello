"use client";

import { useRouter } from "next/navigation";

import { QUARTERS } from "@/constants/okr";

type Props = {
  basePath: string;
  year: number;
  quarter?: number; // set for OKR tab
  half?: "H1" | "H2"; // set for KPI tab
};

const YEAR_RANGE = 3; // years before/after current

export const PeriodPicker = ({ basePath, year, quarter, half }: Props) => {
  const router = useRouter();
  const years: number[] = [];
  for (let y = year - YEAR_RANGE; y <= year + YEAR_RANGE; y++) years.push(y);

  const navigate = (nextYear: number, nextQuarter?: number, nextHalf?: string) => {
    const params = new URLSearchParams();
    params.set("year", String(nextYear));
    if (nextQuarter !== undefined) params.set("quarter", String(nextQuarter));
    if (nextHalf !== undefined) params.set("half", nextHalf);
    router.push(`${basePath}?${params.toString()}`);
  };

  const selectClass =
    "h-8 rounded-md border border-input bg-transparent px-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring";

  return (
    <div className="flex items-center gap-x-2">
      {quarter !== undefined && (
        <select
          value={quarter}
          onChange={(e) => navigate(year, Number(e.target.value))}
          className={selectClass}
        >
          {QUARTERS.map((q) => (
            <option key={q} value={q}>
              Quý {q} | Q{q}
            </option>
          ))}
        </select>
      )}
      {half !== undefined && (
        <select
          value={half}
          onChange={(e) => navigate(year, undefined, e.target.value)}
          className={selectClass}
        >
          <option value="H1">T1–T6 | H1</option>
          <option value="H2">T7–T12 | H2</option>
        </select>
      )}
      <select
        value={year}
        onChange={(e) => navigate(Number(e.target.value), quarter, half)}
        className={selectClass}
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
};
