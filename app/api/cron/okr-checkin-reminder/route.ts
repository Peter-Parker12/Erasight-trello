import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { createNotifications } from "@/lib/create-notification";
import { escapeHtml, sendTelegramMessage } from "@/lib/telegram";
import { computeObjectiveScore, formatScore, getStatusBand } from "@/lib/okr-score";

// Triggered by an external scheduler, secured with a shared secret header:
//   POST /api/cron/okr-checkin-reminder?type=weekly   — Mondays 07:00 (ICT)
//   POST /api/cron/okr-checkin-reminder?type=monthly  — 1st of month 07:00 (ICT)
export async function POST(req: Request) {
  const secret = req.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  if (type !== "weekly" && type !== "monthly") {
    return new NextResponse("Invalid type — use ?type=weekly|monthly", { status: 400 });
  }

  try {
    const departments = await db.department.findMany({
      where: { leaderId: { not: null } },
      orderBy: { order: "asc" },
    });

    const byOrg = new Map<string, typeof departments>();
    for (const department of departments) {
      const list = byOrg.get(department.orgId) ?? [];
      list.push(department);
      byOrg.set(department.orgId, list);
    }

    const now = new Date();
    const quarter = Math.floor(now.getMonth() / 3) + 1;
    const year = now.getFullYear();

    let notificationsCreated = 0;
    let telegramSent = 0;

    for (const [orgId, orgDepartments] of byOrg) {
      const leaderIds = [...new Set(orgDepartments.map((d) => d.leaderId!))];

      // in-app notifications
      const message =
        type === "weekly"
          ? "⏰ Cập nhật KPI tuần (30') | Weekly KPI update (30'): cập nhật cột Thực tế trên KPI Dashboard."
          : "📅 Check-in OKR tháng (60') | Monthly OKR check-in (60'): cập nhật Actuals, nêu blocker và điền KPI tháng trước.";

      await createNotifications({
        userIds: leaderIds,
        orgId,
        type: "OKR_REMINDER",
        message,
        actorName: "System",
        actorImage: "",
      });
      notificationsCreated += leaderIds.length;

      // Telegram group message (optional per-org config)
      const config = await db.orgTelegramConfig.findUnique({ where: { orgId } });
      if (!config || !config.enabled) continue;

      const telegramAccounts = await db.userTelegramAccount.findMany({
        where: { orgId, userId: { in: leaderIds } },
      });
      const usernameByUserId = new Map(
        telegramAccounts.map((a) => [a.userId, a.telegramUsername])
      );
      const mention = (userId: string) => {
        const username = usernameByUserId.get(userId);
        return username ? `@${username.replace(/^@/, "")}` : "";
      };

      let text: string;
      if (type === "weekly") {
        const lines = orgDepartments.map(
          (d) => `• ${escapeHtml(d.name)} ${mention(d.leaderId!)}`.trim()
        );
        text =
          `⏰ <b>Cập nhật KPI tuần (30') | Weekly KPI update</b>\n` +
          `Leaders cập nhật cột Thực tế trên KPI Dashboard:\n${lines.join("\n")}`;
      } else {
        const objectives = await db.objective.findMany({
          where: { orgId, quarter, year },
          include: { keyResults: true },
          orderBy: { order: "asc" },
        });
        const sections = orgDepartments.map((d) => {
          const items = objectives.filter((o) => o.departmentId === d.id);
          const header = `• <b>${escapeHtml(d.name)}</b> ${mention(d.leaderId!)}`.trim();
          if (items.length === 0) return `${header}\n   (chưa có OKR quý này)`;
          const rows = items.map((o) => {
            const score = computeObjectiveScore(o.keyResults);
            const band = getStatusBand(score);
            return `   ${band.emoji} ${formatScore(score)} — ${escapeHtml(o.title)}`;
          });
          return `${header}\n${rows.join("\n")}`;
        });
        text =
          `📅 <b>Check-in OKR tháng (60') | Monthly OKR check-in</b> — Q${quarter}/${year}\n` +
          `Cập nhật Actuals, nêu blocker và điền KPI tháng trước.\n\n` +
          sections.join("\n");
      }

      await sendTelegramMessage({
        botToken: config.botToken,
        chatId: config.chatId,
        topicId: config.topicId,
        text,
      });
      telegramSent++;
    }

    return NextResponse.json({
      ok: true,
      type,
      orgsProcessed: byOrg.size,
      notificationsCreated,
      telegramSent,
    });
  } catch (e) {
    console.error("[OKR_CHECKIN_REMINDER_ERROR]", e);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
