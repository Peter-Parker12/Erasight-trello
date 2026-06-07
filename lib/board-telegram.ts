import { db } from "@/lib/db";
import { sendTelegramMessage, escapeHtml } from "@/lib/telegram";
import { absoluteUrl } from "@/lib/utils";

const cardLink = (boardId: string, cardId: string): string =>
  absoluteUrl(`/board/${boardId}?card=${cardId}`);

export const notifyCardAssigned = async ({
  boardId,
  orgId,
  cardId,
  cardTitle,
  assigneeUserId,
  assigneeName,
}: {
  boardId: string;
  orgId: string;
  cardId: string;
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
  const link = escapeHtml(cardLink(boardId, cardId));

  await sendTelegramMessage({
    botToken: config.botToken,
    chatId: config.chatId,
    topicId: config.topicId,
    text: `📌 <a href="${link}"><b>${escapeHtml(cardTitle)}</b></a> has been assigned to ${mention}`,
  });
};

export const notifyCardInReview = async ({
  boardId,
  cardId,
  cardTitle,
}: {
  boardId: string;
  cardId: string;
  cardTitle: string;
}): Promise<void> => {
  const config = await db.boardTelegramConfig.findUnique({ where: { boardId } });
  if (!config || !config.enabled || !config.reviewListId) return;

  const link = escapeHtml(cardLink(boardId, cardId));

  await sendTelegramMessage({
    botToken: config.botToken,
    chatId: config.chatId,
    topicId: config.topicId,
    text: `🔍 <a href="${link}"><b>${escapeHtml(cardTitle)}</b></a> has moved to review. Mentors, please take a look!`,
  });
};

export const sendDueTodayReminder = async ({
  boardId,
  cards,
}: {
  boardId: string;
  cards: { id: string; title: string; listTitle: string }[];
}): Promise<void> => {
  if (cards.length === 0) return;

  const config = await db.boardTelegramConfig.findUnique({ where: { boardId } });
  if (!config || !config.enabled) return;

  const lines = cards.map(
    (c) =>
      `• <a href="${escapeHtml(cardLink(boardId, c.id))}"><b>${escapeHtml(c.title)}</b></a> (${escapeHtml(c.listTitle)})`
  );

  await sendTelegramMessage({
    botToken: config.botToken,
    chatId: config.chatId,
    topicId: config.topicId,
    text: `⏰ <b>Tasks due today</b>\n\n${lines.join("\n")}`,
  });
};
