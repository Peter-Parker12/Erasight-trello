import { db } from "@/lib/db";
import { sendTelegramMessage, escapeHtml } from "@/lib/telegram";

export const notifyCardAssigned = async ({
  boardId,
  orgId,
  cardTitle,
  assigneeUserId,
  assigneeName,
}: {
  boardId: string;
  orgId: string;
  cardTitle: string;
  assigneeUserId: string;
  assigneeName: string;
}): Promise<void> => {
  const config = await db.boardTelegramConfig.findUnique({ where: { boardId } });
  if (!config || !config.enabled) return;

  const account = await db.userTelegramAccount.findUnique({
    where: { orgId_userId: { orgId, userId: assigneeUserId } },
  });

  const mention = account ? `@${escapeHtml(account.telegramUsername)}` : escapeHtml(assigneeName);

  await sendTelegramMessage({
    botToken: config.botToken,
    chatId: config.chatId,
    topicId: config.topicId,
    text: `📌 <b>${escapeHtml(cardTitle)}</b> has been assigned to ${mention}`,
  });
};

export const notifyCardInReview = async ({
  boardId,
  cardTitle,
}: {
  boardId: string;
  cardTitle: string;
}): Promise<void> => {
  const config = await db.boardTelegramConfig.findUnique({ where: { boardId } });
  if (!config || !config.enabled || !config.reviewListId) return;

  await sendTelegramMessage({
    botToken: config.botToken,
    chatId: config.chatId,
    topicId: config.topicId,
    text: `🔍 <b>${escapeHtml(cardTitle)}</b> has moved to review. Mentors, please take a look!`,
  });
};

export const sendDueTodayReminder = async ({
  boardId,
  cards,
}: {
  boardId: string;
  cards: { title: string; listTitle: string }[];
}): Promise<void> => {
  if (cards.length === 0) return;

  const config = await db.boardTelegramConfig.findUnique({ where: { boardId } });
  if (!config || !config.enabled) return;

  const lines = cards.map((c) => `• <b>${escapeHtml(c.title)}</b> (${escapeHtml(c.listTitle)})`);

  await sendTelegramMessage({
    botToken: config.botToken,
    chatId: config.chatId,
    topicId: config.topicId,
    text: `⏰ <b>Tasks due today</b>\n\n${lines.join("\n")}`,
  });
};
