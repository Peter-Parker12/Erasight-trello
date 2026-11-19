import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { sendBoardDueTodayReminder } from "@/lib/board-notify";

// Triggered by an external scheduler (e.g. cron-job.org, GitHub Actions, Vercel Cron)
// at 7:00 AM, secured with a shared secret header.
export async function POST(req: Request) {
  const secret = req.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // Route name predates Zalo; it now covers every board chat channel.
    const [telegramConfigs, zaloConfigs] = await Promise.all([
      db.boardTelegramConfig.findMany({ where: { enabled: true }, select: { boardId: true } }),
      db.boardZaloConfig.findMany({ where: { enabled: true }, select: { boardId: true } }),
    ]);
    const boardIds = [...new Set([...telegramConfigs, ...zaloConfigs].map((c) => c.boardId))];

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    let notified = 0;

    for (const boardId of boardIds) {
      const cards = await db.card.findMany({
        where: {
          list: { boardId },
          completed: false,
          dueDate: { gte: startOfDay, lte: endOfDay },
        },
        include: { list: { select: { title: true } } },
        orderBy: { dueDate: "asc" },
      });

      if (cards.length === 0) continue;

      await sendBoardDueTodayReminder({
        boardId,
        cards: cards.map((c) => ({ id: c.id, title: c.title, listTitle: c.list.title })),
      });
      notified++;
    }

    return NextResponse.json({ ok: true, boardsChecked: boardIds.length, boardsNotified: notified });
  } catch (e) {
    console.error("[TELEGRAM_DAILY_REMINDER_ERROR]", e);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
