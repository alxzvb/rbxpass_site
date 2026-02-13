type NewOrderTelegramPayload = {
  amount: number | string;
  gamepassUrl: string;
  orderId?: number | string;
  customerTelegram?: string;
  createdAt: Date | string;
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatRuDate(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleString("ru-RU");
}

export async function sendNewOrderTelegramNotification(
  payload: NewOrderTelegramPayload
): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();

  if (!token || !chatId) {
    return;
  }

  const safeAmount = escapeHtml(String(payload.amount));
  const safeUrl = escapeHtml(payload.gamepassUrl || "-");
  const safeOrderId = escapeHtml(payload.orderId ? String(payload.orderId) : "-");
  const safeCustomerTelegram = escapeHtml(payload.customerTelegram || "-");
  const safeDate = escapeHtml(formatRuDate(payload.createdAt));

  const text = [
    "🔔 <b>Новый заказ</b>",
    "",
    `💰 Номинал: <b>${safeAmount} Robux</b>`,
    `🔗 GamePass: ${safeUrl}`,
    `📨 Telegram клиента: ${safeCustomerTelegram}`,
    `🆔 ID: ${safeOrderId}`,
    `🕒 ${safeDate}`,
  ].join("\n");

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("Telegram sendMessage failed:", res.status, body);
    }
  } catch (error) {
    console.error("Telegram notification error:", error);
  }
}
