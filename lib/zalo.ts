const ZALO_API_BASE = "https://bot-api.zaloplatforms.com";

// Zalo Bot API rejects messages over 2000 characters.
export const ZALO_MESSAGE_LIMIT = 2000;

type SendZaloMessageParams = {
  botToken: string;
  chatId: string;
  text: string;
};

// Sent as plain text (no parse_mode): Zalo's HTML/markdown subset has no link
// tag, and raw URLs are auto-linked by the client anyway.
export const sendZaloMessage = async ({
  botToken,
  chatId,
  text,
}: SendZaloMessageParams): Promise<void> => {
  try {
    const res = await fetch(`${ZALO_API_BASE}/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });

    const data = (await res.json().catch(() => null)) as { ok?: boolean; description?: string } | null;
    if (!res.ok || !data?.ok) {
      console.error("[ZALO_SEND_ERROR]", res.status, data?.description ?? data);
    }
  } catch (error) {
    console.error("[ZALO_SEND_ERROR]", error);
  }
};

export const chunkZaloText = (text: string, limit = ZALO_MESSAGE_LIMIT): string[] => {
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > limit) {
    chunks.push(remaining.slice(0, limit));
    remaining = remaining.slice(limit);
  }
  chunks.push(remaining);
  return chunks;
};
