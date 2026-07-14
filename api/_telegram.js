const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export async function tgApi(method, payload) {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!data.ok) console.error(`Telegram API ${method} falhou:`, data.description);
  return data;
}

export async function sendTelegramMessage(chatId, text, replyMarkup) {
  return tgApi('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    reply_markup: replyMarkup,
  });
}
