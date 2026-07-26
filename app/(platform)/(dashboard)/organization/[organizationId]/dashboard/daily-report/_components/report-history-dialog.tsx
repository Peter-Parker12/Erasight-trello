"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { History } from "lucide-react";
import { format } from "date-fns";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetcher } from "@/lib/fetcher";

type HistoryData = {
  count: number;
  reports: {
    id: string;
    reportDate: string;
    content: string;
    projectName: string | null;
    updatedAt: string;
  }[];
};

type ReportHistoryDialogProps = {
  userId: string;
  userName: string;
  totalReports: number;
};

export const ReportHistoryDialog = ({
  userId,
  userName,
  totalReports,
}: ReportHistoryDialogProps) => {
  const [open, setOpen] = useState(false);

  const { data, isLoading, isError } = useQuery<HistoryData>({
    queryKey: ["daily-report-history", userId],
    queryFn: () => fetcher(`/api/orgs/daily-reports?userId=${userId}`),
    enabled: open,
    retry: false,
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="h-7 text-xs gap-1">
          <History className="h-3.5 w-3.5" />
          {totalReports} report{totalReports === 1 ? "" : "s"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Report history — {userName}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <p className="text-sm text-muted-foreground py-4">Loading history…</p>
        ) : isError ? (
          <p className="text-sm text-destructive py-4">Failed to load history.</p>
        ) : !data || data.reports.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No reports yet.</p>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto divide-y divide-border">
            {data.reports.map((r) => (
              <div key={r.id} className="py-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xs font-semibold text-primary">
                    {format(new Date(r.reportDate), "EEE, MMM d yyyy")}
                  </p>
                  {r.projectName && (
                    <Badge variant="secondary" className="text-[10px]">
                      {r.projectName}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-foreground whitespace-pre-wrap mt-0.5">{r.content}</p>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
