import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { normalizeTelegramUsername } from "@/lib/telegram";
import { reportDateFor } from "@/lib/daily-report";

// Inbound Telegram webhook. The bot forwards channel/group messages here; each
// message from a member that maps to a Taskify user is stored as that user's
// daily report for the day. Telegram retries on any non-2xx, so we ALWAYS
// return 200 (even when ignoring an update) and never throw.
export async function POST(req: Request) {
  try {
    const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (
      !secret ||
      req.headers.get("x-telegram-bot-api-secret-token") !== secret
    ) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const update = await req.json().catch(() => null);
    if (!update) return NextResponse.json({ ok: true });

    // Accept new or edited messages / channel posts.
    const message =
      update.message ??
      update.edited_message ??
      update.channel_post ??
      update.edited_channel_post;

    const chatId = message?.chat?.id;
    const username: string | undefined = message?.from?.username;
    const text: string | undefined = message?.text ?? message?.caption;
    const messageId = message?.message_id;
    const messageDate: number | undefined = message?.date; // unix seconds

    if (chatId == null || !username || !text?.trim()) {
      return NextResponse.json({ ok: true });
    }

    // Resolve the org by matching the incoming chat to a configured channel.
    const orgConfig = await db.orgTelegramConfig.findFirst({
      where: { chatId: String(chatId), enabled: true },
    });
    if (!orgConfig) return NextResponse.json({ ok: true });

    const orgId = orgConfig.orgId;
    const normalized = normalizeTelegramUsername(username);

    // Resolve the Taskify user from their linked telegram username. Telegram
    // usernames are case-insensitive, and self-service linking may have stored
    // them with mixed case, so match case-insensitively.
    const account = await db.userTelegramAccount.findFirst({
      where: { orgId, telegramUsername: { equals: normalized, mode: "insensitive" } },
    });
    if (!account) return NextResponse.json({ ok: true });

    const reportDate = reportDateFor(
      messageDate ? new Date(messageDate * 1000) : new Date()
    );

    // A new/edited message replaces that day's report content with the latest.
    await db.dailyReport.upsert({
      where: {
        orgId_userId_reportDate: { orgId, userId: account.userId, reportDate },
      },
      update: {
        content: text,
        telegramUsername: normalized,
        telegramMessageId: messageId != null ? String(messageId) : null,
      },
      create: {
        orgId,
        userId: account.userId,
        reportDate,
        content: text,
        telegramUsername: normalized,
        telegramMessageId: messageId != null ? String(messageId) : null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[TELEGRAM_WEBHOOK]", error);
    // Still 200 so Telegram doesn't spin retrying a poisoned update.
    return NextResponse.json({ ok: true });
  }
}
