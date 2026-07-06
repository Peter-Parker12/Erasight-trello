"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { fetcher } from "@/lib/fetcher";
import { cn } from "@/lib/utils";
import { MemberTelegramEdit } from "./member-telegram-edit";
import { ReportHistoryDialog } from "./report-history-dialog";

type Member = {
  userId: string;
  userName: string;
  userImage: string;
  telegramUsername: string | null;
  hasReported: boolean;
  content: string | null;
  reportedAt: string | null;
  totalReports: number;
};

type DailyReportData = {
  date: string;
  members: Member[];
};

const MemberRow = ({ member, onChanged }: { member: Member; onChanged: () => void }) => (
  <div className="flex items-start gap-3 py-3">
    <Avatar className="h-8 w-8 mt-0.5">
      <AvatarImage src={member.userImage} />
      <AvatarFallback>{member.userName[0]}</AvatarFallback>
    </Avatar>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium text-[#e5e5e5] truncate">{member.userName}</span>
        <MemberTelegramEdit
          userId={member.userId}
          telegramUsername={member.telegramUsername}
          onSaved={onChanged}
        />
      </div>
      {member.hasReported ? (
        <p className="text-sm text-[#cfcfcf] whitespace-pre-wrap mt-1">{member.content}</p>
      ) : (
        <p className="text-xs text-amber-400 mt-1">Hasn&apos;t reported yet today.</p>
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
  const { data, isLoading, isError } = useQuery<DailyReportData>({
    queryKey: ["daily-reports", organizationId, "today"],
    queryFn: () => fetcher("/api/orgs/daily-reports"),
    retry: false,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["daily-reports", organizationId, "today"] });
  };

  if (isLoading) return <p className="text-sm text-muted-foreground py-4">Loading daily reports…</p>;
  if (isError || !data) {
    return (
      <p className="text-sm text-red-500 py-4">
        Failed to load daily reports. Make sure the database schema is up to date (
        <code>prisma db push</code>).
      </p>
    );
  }

  const notReported = data.members.filter((m) => !m.hasReported);
  const reported = data.members.filter((m) => m.hasReported);

  return (
    <div className="space-y-6 py-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[#e5e5e5]">
          Daily report — {format(new Date(data.date), "EEE, MMM d yyyy")}
        </h2>
        <span className="text-xs text-muted-foreground">
          {reported.length} / {data.members.length} reported
        </span>
      </div>

      {/* Not reported — highlighted */}
      <div>
        <div className="flex items-center gap-1.5 mb-1">
          <AlertTriangle className="h-4 w-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-amber-400">
            Not reported yet ({notReported.length})
          </h3>
        </div>
        <div
          className={cn(
            "rounded-lg border px-4 divide-y",
            notReported.length > 0
              ? "border-amber-500/30 bg-amber-500/5 divide-amber-500/20"
              : "border-[#333] divide-[#333]"
          )}
        >
          {notReported.length === 0 ? (
            <p className="text-sm text-muted-foreground py-3">Everyone has reported. 🎉</p>
          ) : (
            notReported.map((m) => <MemberRow key={m.userId} member={m} onChanged={invalidate} />)
          )}
        </div>
      </div>

      {/* Reported */}
      <div>
        <div className="flex items-center gap-1.5 mb-1">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <h3 className="text-sm font-semibold text-[#e5e5e5]">Reported ({reported.length})</h3>
        </div>
        <div className="rounded-lg border border-[#333] px-4 divide-y divide-[#333]">
          {reported.length === 0 ? (
            <p className="text-sm text-muted-foreground py-3">No reports yet today.</p>
          ) : (
            reported.map((m) => <MemberRow key={m.userId} member={m} onChanged={invalidate} />)
          )}
        </div>
      </div>
    </div>
  );
};
