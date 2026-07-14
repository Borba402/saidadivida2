// Registra o webhook do bot Telegram com secret_token (proteção nativa do
// Telegram: o header X-Telegram-Bot-Api-Secret-Token é verificado no handler
// em api/telegram-webhook.js — NÃO é HMAC, é o mecanismo do próprio setWebhook).
//
// Uso:
//   TELEGRAM_BOT_TOKEN=xxx TELEGRAM_WEBHOOK_SECRET=yyy node scripts/set-telegram-webhook.mjs https://saidadivida2.vercel.app

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SECRET    = process.env.TELEGRAM_WEBHOOK_SECRET;
const baseUrl   = process.argv[2];

if (!BOT_TOKEN || !SECRET || !baseUrl) {
  console.error('Uso: TELEGRAM_BOT_TOKEN=xxx TELEGRAM_WEBHOOK_SECRET=yyy node scripts/set-telegram-webhook.mjs https://SEU-DOMINIO.vercel.app');
  process.exit(1);
}

const webhookUrl = `${baseUrl.replace(/\/$/, '')}/api/telegram-webhook`;

const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ url: webhookUrl, secret_token: SECRET }),
});
const data = await res.json();

if (!data.ok) {
  console.error('❌ Falha ao registrar webhook:', data.description);
  process.exit(1);
}

console.log(`✅ Webhook registrado em ${webhookUrl}`);

const info = await (await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`)).json();
console.log('\nStatus atual:', JSON.stringify(info.result, null, 2));
