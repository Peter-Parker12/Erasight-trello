import { db } from "@/lib/db";
import { sendTelegramMessage, escapeHtml } from "@/lib/telegram";
import { absoluteUrl } from "@/lib/utils";

const cardLink = (boardId: string, cardId: string): string | null => {
  if (!process.env.NEXT_PUBLIC_APP_URL) return null;
  return absoluteUrl(`/board/${boardId}?card=${cardId}`);
};

const cardTitleHtml = (boardId: string, cardId: string, cardTitle: string): string => {
  const link = cardLink(boardId, cardId);
  const title = `<b>${escapeHtml(cardTitle)}</b>`;
  return link ? `<a href="${escapeHtml(link)}">${title}</a>` : title;
};

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

  await sendTelegramMessage({
    botToken: config.botToken,
    chatId: config.chatId,
    topicId: config.topicId,
    text: `📌 ${cardTitleHtml(boardId, cardId, cardTitle)} has been assigned to ${mention}`,
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

  await sendTelegramMessage({
    botToken: config.botToken,
    chatId: config.chatId,
    topicId: config.topicId,
    text: `🔍 ${cardTitleHtml(boardId, cardId, cardTitle)} has moved to review. Mentors, please take a look!`,
  });
};

export const notifyReviewReady = async ({
  boardId,
  cardId,
  cardTitle,
  attachmentName,
  reviewText,
}: {
  boardId: string;
  cardId: string;
  cardTitle: string;
  attachmentName: string;
  reviewText: string;
}): Promise<void> => {
  const config = await db.boardTelegramConfig.findUnique({ where: { boardId } });
  if (!config || !config.enabled) return;

  const header = `✅ Review for ${cardTitleHtml(boardId, cardId, cardTitle)}\n📎 <b>${escapeHtml(attachmentName)}</b>\n\n`;
  const body = escapeHtml(reviewText);
  const LIMIT = 4000;

  const chunks: string[] = [];
  let remaining = header + body;
  while (remaining.length > LIMIT) {
    chunks.push(remaining.slice(0, LIMIT));
    remaining = remaining.slice(LIMIT);
  }
  chunks.push(remaining);

  for (const chunk of chunks) {
    await sendTelegramMessage({
      botToken: config.botToken,
      chatId: config.chatId,
      topicId: config.topicId,
      text: chunk,
    });
  }
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
    (c) => `• ${cardTitleHtml(boardId, c.id, c.title)} (${escapeHtml(c.listTitle)})`
  );

  await sendTelegramMessage({
    botToken: config.botToken,
    chatId: config.chatId,
    topicId: config.topicId,
    text: `⏰ <b>Tasks due today</b>\n\n${lines.join("\n")}`,
  });
};
