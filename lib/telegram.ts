export const escapeHtml = (text: string): string =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

type SendTelegramMessageParams = {
  botToken: string;
  chatId: string;
  topicId?: string | null;
  text: string;
};

export const sendTelegramMessage = async ({
  botToken,
  chatId,
  topicId,
  text,
}: SendTelegramMessageParams): Promise<void> => {
  try {
    const body: Record<string, unknown> = {
      chat_id: chatId,
      text,
      parse_mode: "HTML",
    };

    if (topicId) body.message_thread_id = Number(topicId);

    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      console.error("[TELEGRAM_SEND_ERROR]", await res.text());
    }
  } catch (error) {
    console.error("[TELEGRAM_SEND_ERROR]", error);
  }
};
