import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";

import { db } from "@/lib/db";
import { isOrgAdmin } from "@/lib/board-access";
import { isAdminRole } from "@/lib/roles";
import { reportDateFor, todayReportDate } from "@/lib/daily-report";

// Admin-only data route backing the Daily Report view.
//   GET                    → today's report status for every non-admin member
//   GET ?date=YYYY-MM-DD   → same, for a specific day
//   GET ?userId=<id>       → one member's full report history (most recent first)
export async function GET(req: Request) {
  try {
    const { orgId } = await auth();
    if (!orgId) return new NextResponse("Unauthorized", { status: 401 });

    if (!(await isOrgAdmin(orgId))) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const url = new URL(req.url);
    const historyUserId = url.searchParams.get("userId");

    // ---- History for a single member ----
    if (historyUserId) {
      const reports = await db.dailyReport.findMany({
        where: { orgId, userId: historyUserId },
        orderBy: { reportDate: "desc" },
        take: 180,
      });
      return NextResponse.json({
        count: reports.length,
        reports: reports.map((r) => ({
          id: r.id,
          reportDate: r.reportDate.toISOString().slice(0, 10),
          content: r.content,
          updatedAt: r.updatedAt.toISOString(),
        })),
      });
    }

    // ---- Roster + status for a given day ----
    const dateParam = url.searchParams.get("date");
    const reportDate = dateParam ? reportDateFor(new Date(dateParam)) : todayReportDate();

    const client = await clerkClient();
    const [orgMemberList, displayNames, telegramAccounts, reports, counts] =
      await Promise.all([
        client.organizations.getOrganizationMembershipList({
          organizationId: orgId,
          limit: 100,
        }),
        db.userDisplayName.findMany({ where: { orgId } }),
        db.userTelegramAccount.findMany({ where: { orgId } }),
        db.dailyReport.findMany({ where: { orgId, reportDate } }),
        db.dailyReport.groupBy({ by: ["userId"], where: { orgId }, _count: { _all: true } }),
      ]);

    const displayNameMap = new Map(displayNames.map((d) => [d.userId, d.displayName]));
    const telegramMap = new Map(telegramAccounts.map((t) => [t.userId, t.telegramUsername]));
    const reportMap = new Map(reports.map((r) => [r.userId, r]));
    const countMap = new Map(counts.map((c) => [c.userId, c._count._all]));

    // Exclude admins — only non-admin members are expected to report.
    const members = orgMemberList.data
      .filter((m) => !isAdminRole(m.role))
      .map((m) => {
        const uid = m.publicUserData?.userId ?? "";
        const clerkName =
          `${m.publicUserData?.firstName ?? ""} ${m.publicUserData?.lastName ?? ""}`.trim() ||
          m.publicUserData?.identifier ||
          "Unknown";
        const report = reportMap.get(uid);
        return {
          userId: uid,
          userName: displayNameMap.get(uid) ?? clerkName,
          userImage: m.publicUserData?.imageUrl ?? "",
          telegramUsername: telegramMap.get(uid) ?? null,
          hasReported: !!report,
          content: report?.content ?? null,
          reportedAt: report?.updatedAt.toISOString() ?? null,
          totalReports: countMap.get(uid) ?? 0,
        };
      });

    return NextResponse.json({
      date: reportDate.toISOString().slice(0, 10),
      members,
    });
  } catch (e) {
    console.error("[DAILY_REPORTS_GET]", e);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
