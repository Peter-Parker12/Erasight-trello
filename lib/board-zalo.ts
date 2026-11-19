import { db } from "@/lib/db";
import { sendZaloMessage, chunkZaloText } from "@/lib/zalo";
import { absoluteUrl } from "@/lib/utils";

const cardTitleText = (boardId: string, cardId: string, cardTitle: string): string => {
  if (!process.env.NEXT_PUBLIC_APP_URL) return `"${cardTitle}"`;
  return `"${cardTitle}" (${absoluteUrl(`/board/${boardId}?card=${cardId}`)})`;
};

const getEnabledConfig = async (boardId: string) => {
  const config = await db.boardZaloConfig.findUnique({ where: { boardId } });
  return config?.enabled ? config : null;
};

export const notifyZaloCardAssigned = async ({
  boardId,
  cardId,
  cardTitle,
  assigneeName,
}: {
  boardId: string;
  cardId: string;
  cardTitle: string;
  assigneeName: string;
}): Promise<void> => {
  const config = await getEnabledConfig(boardId);
  if (!config) return;

  await sendZaloMessage({
    botToken: config.botToken,
    chatId: config.chatId,
    text: `📌 ${cardTitleText(boardId, cardId, cardTitle)} has been assigned to ${assigneeName}`,
  });
};

export const notifyZaloReviewReady = async ({
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
  const config = await getEnabledConfig(boardId);
  if (!config) return;

  const header = `✅ Review for ${cardTitleText(boardId, cardId, cardTitle)}\n📎 ${attachmentName}\n\n`;

  for (const chunk of chunkZaloText(header + reviewText)) {
    await sendZaloMessage({ botToken: config.botToken, chatId: config.chatId, text: chunk });
  }
};

export const sendZaloDueTodayReminder = async ({
  boardId,
  cards,
}: {
  boardId: string;
  cards: { id: string; title: string; listTitle: string }[];
}): Promise<void> => {
  if (cards.length === 0) return;

  const config = await getEnabledConfig(boardId);
  if (!config) return;

  const lines = cards.map((c) => `• ${cardTitleText(boardId, c.id, c.title)} [${c.listTitle}]`);

  for (const chunk of chunkZaloText(`⏰ Tasks due today\n\n${lines.join("\n")}`)) {
    await sendZaloMessage({ botToken: config.botToken, chatId: config.chatId, text: chunk });
  }
};
