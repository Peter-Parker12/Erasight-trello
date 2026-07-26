"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetcher } from "@/lib/fetcher";
import { cn } from "@/lib/utils";
import { todayReportDateString, shiftReportDateString } from "@/lib/daily-report";
import { MemberTelegramEdit } from "./member-telegram-edit";
import { ReportHistoryDialog } from "./report-history-dialog";

type Member = {
  userId: string;
  userName: string;
  userImage: string;
  telegramUsername: string | null;
  hasReported: boolean;
  content: string | null;
  projectName: string | null;
  tasksToComplete: string | null;
  todayPlan: string | null;
  difficulties: string | null;
  reportedAt: string | null;
  totalReports: number;
};

type DailyReportData = {
  date: string;
  members: Member[];
};

const MemberRow = ({
  member,
  isToday,
  onChanged,
}: {
  member: Member;
  isToday: boolean;
  onChanged: () => void;
}) => (
  <div className="flex items-start gap-3 py-3">
    <Avatar className="h-8 w-8 mt-0.5">
      <AvatarImage src={member.userImage} />
      <AvatarFallback>{member.userName[0]}</AvatarFallback>
    </Avatar>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium text-foreground truncate">{member.userName}</span>
        {member.projectName && (
          <Badge variant="secondary" className="text-[10px]">
            {member.projectName}
          </Badge>
        )}
        <MemberTelegramEdit
          userId={member.userId}
          telegramUsername={member.telegramUsername}
          onSaved={onChanged}
        />
      </div>
      {member.hasReported ? (
        <p className="text-sm text-foreground whitespace-pre-wrap mt-1">{member.content}</p>
      ) : (
        <p className="text-xs text-amber-400 mt-1">
          {isToday ? "Hasn't reported yet today." : "Did not report on this date."}
        </p>
      )}
    </div>
    <div className="shrink-0 flex flex-col items-end gap-1">
      {member.hasReported && member.reportedAt && (
        <span className="text-[10px] text-muted-foreground">
          {format(new Date(member.reportedAt), "HH:mm")}
        </span>
      )}
      <ReportHistoryDialog
        userId={member.userId}
        userName={member.userName}
        totalReports={member.totalReports}
      />
    </div>
  </div>
);

export const DailyReportPanel = ({ organizationId }: { organizationId: string }) => {
  const queryClient = useQueryClient();
  const todayStr = todayReportDateString();
  // null = today. A "YYYY-MM-DD" string when browsing a past date.
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const dateParam = selectedDate ?? todayStr;
  const isToday = dateParam === todayStr;

  const { data, isLoading, isError } = useQuery<DailyReportData>({
    queryKey: ["daily-reports", organizationId, dateParam],
    queryFn: () =>
      fetcher(`/api/orgs/daily-reports${selectedDate ? `?date=${selectedDate}` : ""}`),
    retry: false,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["daily-reports", organizationId, dateParam] });
  };

  const goToDate = (date: string) => setSelectedDate(date === todayStr ? null : date);
  const goPrevDay = () => goToDate(shiftReportDateString(dateParam, -1));
  const goNextDay = () => goToDate(shiftReportDateString(dateParam, 1));

  if (isLoading) return <p className="text-sm text-muted-foreground py-4">Loading daily reports…</p>;
  if (isError || !data) {
    return (
      <p className="text-sm text-destructive py-4">
        Failed to load daily reports. Make sure the database schema is up to date (
        <code>prisma db push</code>).
      </p>
    );
  }

  const notReported = data.members.filter((m) => !m.hasReported);
  const reported = data.members.filter((m) => m.hasReported);

  return (
    <div className="space-y-6 py-2">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-sm font-semibold text-foreground">
          Daily report — {format(new Date(`${data.date}T00:00:00`), "EEE, MMM d yyyy")}
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {reported.length} / {data.members.length} reported
          </span>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={goPrevDay}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <input
              type="date"
              value={dateParam}
              max={todayStr}
              onChange={(e) => e.target.value && goToDate(e.target.value)}
              className="h-7 rounded-md border border-border bg-input text-foreground text-xs px-1.5"
            />
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              disabled={isToday}
              onClick={goNextDay}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            {!isToday && (
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setSelectedDate(null)}>
                Today
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Not reported — highlighted */}
      <div>
        <div className="flex items-center gap-1.5 mb-1">
          <AlertTriangle className="h-4 w-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-amber-400">
            {isToday ? "Not reported yet" : "Did not report"} ({notReported.length})
          </h3>
        </div>
        <div
          className={cn(
            "rounded-lg border px-4 divide-y",
            notReported.length > 0
              ? "border-amber-500/30 bg-amber-500/5 divide-amber-500/20"
              : "border-border divide-border"
          )}
        >
          {notReported.length === 0 ? (
            <p className="text-sm text-muted-foreground py-3">Everyone has reported. 🎉</p>
          ) : (
            notReported.map((m) => (
              <MemberRow key={m.userId} member={m} isToday={isToday} onChanged={invalidate} />
            ))
          )}
        </div>
      </div>

      {/* Reported */}
      <div>
        <div className="flex items-center gap-1.5 mb-1">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <h3 className="text-sm font-semibold text-foreground">Reported ({reported.length})</h3>
        </div>
        <div className="rounded-lg border border-border px-4 divide-y divide-border">
          {reported.length === 0 ? (
            <p className="text-sm text-muted-foreground py-3">
              {isToday ? "No reports yet today." : "No reports on this date."}
            </p>
          ) : (
            reported.map((m) => (
              <MemberRow key={m.userId} member={m} isToday={isToday} onChanged={invalidate} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};
