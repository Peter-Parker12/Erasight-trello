import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { sendDueTodayReminder } from "@/lib/board-telegram";

// Triggered by an external scheduler (e.g. cron-job.org, GitHub Actions, Vercel Cron)
// at 7:00 AM, secured with a shared secret header.
export async function POST(req: Request) {
  const secret = req.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const configs = await db.boardTelegramConfig.findMany({ where: { enabled: true } });

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    let notified = 0;

    for (const config of configs) {
      const cards = await db.card.findMany({
        where: {
          list: { boardId: config.boardId },
          completed: false,
          dueDate: { gte: startOfDay, lte: endOfDay },
        },
        include: { list: { select: { title: true } } },
        orderBy: { dueDate: "asc" },
      });

      if (cards.length === 0) continue;

      await sendDueTodayReminder({
        boardId: config.boardId,
        cards: cards.map((c) => ({ id: c.id, title: c.title, listTitle: c.list.title })),
      });
      notified++;
    }

    return NextResponse.json({ ok: true, boardsChecked: configs.length, boardsNotified: notified });
  } catch (e) {
    console.error("[TELEGRAM_DAILY_REMINDER_ERROR]", e);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
