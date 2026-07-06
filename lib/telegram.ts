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

// Normalize a Telegram @handle for storage/lookup: strip a leading "@" and
// lowercase (Telegram usernames are case-insensitive). Store and query with
// this consistently so inbound username -> user resolution is reliable.
export const normalizeTelegramUsername = (username: string): string =>
  username.trim().replace(/^@+/, "").toLowerCase();

// Registers the inbound webhook for a bot so Telegram delivers updates to us.
// `secret` is echoed back by Telegram in the X-Telegram-Bot-Api-Secret-Token
// header on every update, which the webhook route verifies.
export const registerTelegramWebhook = async (
  botToken: string,
  url: string,
  secret: string
): Promise<{ ok: boolean; error?: string }> => {
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url,
        secret_token: secret,
        allowed_updates: ["message", "edited_message", "channel_post", "edited_channel_post"],
      }),
    });

    const data = (await res.json()) as { ok: boolean; description?: string };
    if (!data.ok) return { ok: false, error: data.description ?? "setWebhook failed" };
    return { ok: true };
  } catch (error) {
    console.error("[TELEGRAM_SET_WEBHOOK_ERROR]", error);
    return { ok: false, error: "Network error contacting Telegram." };
  }
};
