"use client";

import { Info } from "lucide-react";

import { COLOR_LEGEND, SCORING_ROWS } from "@/constants/okr";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

export const Legend = () => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="text-neutral-500">
          <Info className="h-4 w-4 mr-1.5" />
          Quy ước | Legend
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 space-y-3 text-sm">
        <div>
          <p className="font-semibold mb-1.5">Quy ước màu | Color code</p>
          <ul className="space-y-1">
            {COLOR_LEGEND.map((item) => (
              <li key={item.vi} className="flex items-start gap-x-2">
                <span className={`shrink-0 w-10 text-center ${item.swatchClass}`}>
                  {item.sample}
                </span>
                <span className="text-neutral-600">
                  {item.vi}
                  <br />
                  <span className="text-neutral-400">{item.en}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-semibold mb-1.5">Cách chấm điểm | Scoring</p>
          <ul className="space-y-1">
            {SCORING_ROWS.map((row) => (
              <li key={row.range} className="flex items-start gap-x-2">
                <span className="shrink-0 w-16 font-mono text-xs pt-0.5">
                  {row.emoji} {row.range}
                </span>
                <span className="text-neutral-600">
                  {row.vi}
                  <br />
                  <span className="text-neutral-400">{row.en}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </PopoverContent>
    </Popover>
  );
};
