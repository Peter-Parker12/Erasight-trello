"use client";

import { MessageSquareWarning } from "lucide-react";
import { CardWithFullDetail } from "@/types";

type ReasonProps = { data: CardWithFullDetail };

export const Reason = ({ data }: ReasonProps) => {
  if (!data.reason) return null;

  return (
    <div className="flex items-start gap-x-3 w-full">
      <MessageSquareWarning className="h-5 w-5 mt-0.5 text-red-500 shrink-0" />
      <div className="w-full">
        <p className="font-semibold text-[#e5e5e5] mb-2">Reason</p>
        <div className="bg-red-950/40 border border-red-900/40 text-sm text-[#e5e5e5] py-3 px-3.5 rounded-md whitespace-pre-wrap">
          {data.reason}
        </div>
      </div>
    </div>
  );
};
