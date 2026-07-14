import { createClient } from '@supabase/supabase-js';
import { tgApi, sendTelegramMessage } from './_telegram.js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

const CATEGORIAS = [
  'Alimentação', 'Moradia', 'Transporte', 'Saúde',
  'Educação', 'Lazer', 'Vestuário', 'Serviços', 'Dívidas', 'Outros'
];

const fmt = (v) => `R$ ${Number(v).toFixed(2).replace('.', ',')}`;

function getMesAtual() {
  const now = new Date();
  return `${MESES[now.getMonth()]}/${now.getFullYear()}`;
}

// ── Telegram API ─────────────────────────────────────────────

const send = sendTelegramMessage;

async function editMessage(chatId, messageId, text, replyMarkup) {
  return tgApi('editMessageText', {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: 'HTML',
    reply_markup: replyMarkup,
  });
}

async function answerCallback(callbackQueryId, text) {
  return tgApi('answerCallbackQuery', {
    callback_query_id: callbackQueryId,
    text,
  });
}

// ── Parser de linguagem natural ───────────────────────────────

function detectCategory(text) {
  const t = text.toLowerCase();
  if (/mercado|supermercado|comida|restaurante|lanche|padaria|açougue|feira|hortifruti/.test(t)) return 'Alimentação';
  if (/aluguel|condomin/.test(t)) return 'Moradia';
  if (/luz|energia|água|gas|gás|internet|telefon|celular|plano/.test(t)) return 'Serviços';
  if (/uber|gasolina|ônibus|metro|combustível|estacionamento|transporte/.test(t)) return 'Transporte';
  if (/farmácia|medico|médico|consulta|saúde|hospital|remédio/.test(t)) return 'Saúde';
  if (/escola|faculdade|curso|livro|mensalidade/.test(t)) return 'Educação';
  if (/roupa|tênis|sapato|camisa|vestuário/.test(t)) return 'Vestuário';
  if (/dívida|divida|empréstimo|parcela|financiamento/.test(t)) return 'Dívidas';
  return 'Outros';
}

// Padrão 1 (verbo): "gastei 50 no mercado" / "paguei 1500 de aluguel"
// Padrão 2 (valor primeiro): "50 mercado" / "120 uber"
// Padrão 3 (descrição primeiro): "mercado 54,90"
const EXPENSE_PATTERNS = [
  { regex: /(?:gastei|paguei|comprei|gasto|despesa)\s+r?\$?\s*(\d+(?:[.,]\d{1,2})?)\s+(?:no|na|de|com|em|p\/|para)?\s*(.+)/i, order: 'valor-nome' },
  { regex: /^r?\$?\s*(\d+(?:[.,]\d{1,2})?)\s+(?:no|na|de|com|em|p\/|para)?\s*(.+)/i, order: 'valor-nome' },
  { regex: /^(.+?)\s+r?\$?\s*(\d+(?:[.,]\d{1,2})?)$/i, order: 'nome-valor' },
];

function parseExpense(text) {
  for (const { regex, order } of EXPENSE_PATTERNS) {
    const m = text.match(regex);
    if (!m) continue;

    const [valorRaw, nomeRaw] = order === 'valor-nome' ? [m[1], m[2]] : [m[2], m[1]];
    const valor = parseFloat(valorRaw.replace(',', '.'));
    const nome = nomeRaw.trim().replace(/^(no |na |de |com |em )/, '').trim();

    if (valor > 0 && nome.length > 0) {
      return { valor, nome, categoria: detectCategory(nome) };
    }
  }
  return null;
}

// ── Teclados inline ────────────────────────────────────────────

function confirmKeyboard() {
  return {
    inline_keyboard: [
      [{ text: '✅ Confirmar', callback_data: 'confirm' }],
      [{ text: '🏷 Trocar categoria', callback_data: 'change_cat' }],
      [{ text: '❌ Cancelar', callback_data: 'cancel' }],
    ],
  };
}

function categoryKeyboard() {
  const rows = [];
  for (let i = 0; i < CATEGORIAS.length; i += 2) {
    rows.push(CATEGORIAS.slice(i, i + 2).map((c) => ({ text: c, callback_data: `cat:${c}` })));
  }
  return { inline_keyboard: rows };
}

function confirmText(pending) {
  return `📝 <b>Confirme o registro em ${pending.mes_referencia}:</b>\n\n📌 ${pending.nome_item}\n💰 ${fmt(pending.valor)}\n🏷 ${pending.categoria}`;
}

// ── Helpers de dados ───────────────────────────────────────────

async function getUserIdByChat(chatId) {
  const { data, error } = await supabase
    .from('telegram_links')
    .select('user_id')
    .eq('telegram_chat_id', String(chatId))
    .maybeSingle();
  if (error) {
    console.error('Erro ao buscar telegram_links:', error);
    return null;
  }
  return data?.user_id ?? null;
}

// ── Handlers de mensagem ───────────────────────────────────────

async function handleStart(chatId, text, username) {
  const token = text.split(' ')[1]?.toUpperCase();
  if (!token) {
    await send(chatId, '👋 Olá! Para conectar sua conta do <b>SaiDaDívida</b>, abra o app e clique em "Conectar Telegram" para obter seu código.');
    return;
  }

  const { data: link, error: findErr } = await supabase
    .from('telegram_links')
    .select('user_id, token_expires_at')
    .eq('link_token', token)
    .maybeSingle();

  if (findErr) {
    console.error('Erro ao buscar link_token:', findErr);
    await send(chatId, '❌ Não consegui verificar seu código, tente novamente.');
    return;
  }
  if (!link) {
    await send(chatId, '❌ Código inválido. Volte ao app e gere um novo código em "Conectar Telegram".');
    return;
  }
  if (new Date(link.token_expires_at) < new Date()) {
    await send(chatId, '⏰ Código expirado. Volte ao app e gere um novo código.');
    return;
  }

  const { error: updateErr } = await supabase.from('telegram_links').update({
    telegram_chat_id: String(chatId),
    telegram_username: username,
    link_token: null,
    token_expires_at: null,
    linked_at: new Date().toISOString(),
  }).eq('user_id', link.user_id);

  if (updateErr) {
    console.error('Erro ao vincular telegram_links:', updateErr);
    await send(chatId, '❌ Não consegui vincular sua conta, tente novamente.');
    return;
  }

  await send(chatId, `✅ Conta vinculada com sucesso! Olá, ${username}!\n\nAgora você pode registrar gastos enviando mensagens como:\n<code>gastei 50 no mercado</code>\n<code>mercado 54,90</code>\n\nDigite /ajuda para ver todos os comandos.`);
}

async function handleSaldo(chatId, userId, mes) {
  const { data, error } = await supabase
    .rpc('resumo_mes', { p_user_id: userId, p_mes_referencia: mes })
    .maybeSingle();

  if (error) {
    console.error('Erro no RPC resumo_mes:', error);
    await send(chatId, '❌ Não consegui buscar o saldo, tente novamente');
    return;
  }

  if (!data || (Number(data.renda_mensal) === 0 && Number(data.total_gastos) === 0)) {
    await send(chatId, `📅 Nenhum dado encontrado para ${mes}.`);
    return;
  }

  const proximos = data.proximos_vencimentos || [];
  const linhasVencimento = proximos.length
    ? proximos.map((i) => `• ${i.nome_item} — ${fmt(i.valor)}${i.data_vencimento ? ` (${i.data_vencimento.split('-').reverse().join('/')})` : ''}`).join('\n')
    : 'Nenhum vencimento pendente 🎉';

  await send(chatId, [
    `📊 <b>Saldo — ${mes}</b>`,
    '',
    `💰 Renda total: ${fmt(data.total_renda)} (principal ${fmt(data.renda_mensal)} + extras ${fmt(data.total_extras)})`,
    `🔴 Comprometido: ${fmt(data.total_gastos)}`,
    `✅ Pago: ${fmt(data.total_pago)} (${data.pct}%)`,
    `🟡 Falta pagar: ${fmt(data.falta_pagar)}`,
    '',
    `💵 Saldo livre: ${fmt(data.saldo)}`,
    '',
    `📆 <b>Próximos vencimentos:</b>`,
    linhasVencimento,
  ].join('\n'));
}

async function handleContas(chatId, userId, mes) {
  const { data: comp, error: compErr } = await supabase
    .from('compromissos')
    .select('id')
    .eq('user_id', userId)
    .eq('mes_referencia', mes)
    .maybeSingle();

  if (compErr) {
    console.error('Erro ao buscar compromisso:', compErr);
    await send(chatId, '❌ Não consegui buscar as contas, tente novamente');
    return;
  }
  if (!comp) {
    await send(chatId, `📅 Nenhuma conta encontrada para ${mes}.`);
    return;
  }

  const { data: itens, error: itensErr } = await supabase
    .from('itens_compromisso')
    .select('nome_item, valor, pago, data_vencimento')
    .eq('compromisso_id', comp.id)
    .eq('pago', false)
    .order('data_vencimento', { ascending: true });

  if (itensErr) {
    console.error('Erro ao buscar itens_compromisso:', itensErr);
    await send(chatId, '❌ Não consegui buscar as contas, tente novamente');
    return;
  }

  if (!itens?.length) {
    await send(chatId, `🎉 Todas as contas de ${mes} já estão pagas!`);
    return;
  }

  const linhas = itens.map(i => `• ${i.nome_item} — ${fmt(i.valor)}${i.data_vencimento ? ` (vence ${i.data_vencimento.split('-').reverse().join('/')})` : ''}`).join('\n');
  await send(chatId, `⚠️ <b>Contas pendentes — ${mes}:</b>\n\n${linhas}`);
}

async function handleExpenseMessage(chatId, userId, mes, text) {
  const expense = parseExpense(text);
  if (!expense) {
    await send(chatId, `❓ Não entendi. Tente:\n<code>gastei 50 no mercado</code>\n<code>mercado 54,90</code>\n\nOu digite /ajuda para ver os comandos.`);
    return;
  }

  const { error } = await supabase.from('telegram_pending_items').upsert({
    chat_id: String(chatId),
    user_id: userId,
    mes_referencia: mes,
    nome_item: expense.nome,
    valor: expense.valor,
    categoria: expense.categoria,
  }, { onConflict: 'chat_id' });

  if (error) {
    console.error('Erro ao salvar pendência telegram_pending_items:', error);
    await send(chatId, '❌ Não consegui salvar, tente novamente');
    return;
  }

  await send(chatId, confirmText({ mes_referencia: mes, nome_item: expense.nome, valor: expense.valor, categoria: expense.categoria }), confirmKeyboard());
}

// ── Handler de callback (botões inline) ─────────────────────────

async function handleCallbackQuery(cq) {
  const chatId    = cq.message.chat.id;
  const messageId = cq.message.message_id;
  const data      = cq.data;

  const { data: pending, error: findErr } = await supabase
    .from('telegram_pending_items')
    .select('*')
    .eq('chat_id', String(chatId))
    .maybeSingle();

  if (findErr) {
    console.error('Erro ao buscar telegram_pending_items:', findErr);
    await answerCallback(cq.id, 'Erro ao buscar solicitação');
    return;
  }
  if (!pending) {
    await answerCallback(cq.id, 'Essa solicitação expirou');
    await editMessage(chatId, messageId, '⏰ Solicitação expirada. Envie o gasto novamente.');
    return;
  }

  if (data === 'confirm') {
    const { error: rpcErr } = await supabase.rpc('registrar_item', {
      p_user_id: pending.user_id,
      p_mes_referencia: pending.mes_referencia,
      p_nome_item: pending.nome_item,
      p_valor: pending.valor,
      p_categoria: pending.categoria,
    });

    if (rpcErr) {
      console.error('Erro no RPC registrar_item:', rpcErr);
      await answerCallback(cq.id, 'Falha ao salvar');
      await editMessage(chatId, messageId, '❌ Não consegui salvar, tente novamente');
      return;
    }

    await supabase.from('telegram_pending_items').delete().eq('chat_id', String(chatId));
    await answerCallback(cq.id, 'Registrado!');
    await editMessage(chatId, messageId, `✅ <b>Registrado em ${pending.mes_referencia}:</b>\n\n📝 ${pending.nome_item}\n💰 ${fmt(pending.valor)}\n🏷 ${pending.categoria}\n\nDigite /saldo para ver o resumo.`);
    return;
  }

  if (data === 'cancel') {
    const { error } = await supabase.from('telegram_pending_items').delete().eq('chat_id', String(chatId));
    if (error) console.error('Erro ao cancelar telegram_pending_items:', error);
    await answerCallback(cq.id, 'Cancelado');
    await editMessage(chatId, messageId, '❌ Cancelado.');
    return;
  }

  if (data === 'change_cat') {
    await answerCallback(cq.id);
    await editMessage(chatId, messageId, `🏷 Escolha a categoria para <b>${pending.nome_item}</b>:`, categoryKeyboard());
    return;
  }

  if (data.startsWith('cat:')) {
    const categoria = data.slice(4);
    const { error } = await supabase
      .from('telegram_pending_items')
      .update({ categoria })
      .eq('chat_id', String(chatId));

    if (error) {
      console.error('Erro ao atualizar categoria pendente:', error);
      await answerCallback(cq.id, 'Falha ao trocar categoria');
      return;
    }

    await answerCallback(cq.id, `Categoria: ${categoria}`);
    await editMessage(chatId, messageId, confirmText({ ...pending, categoria }), confirmKeyboard());
    return;
  }

  await answerCallback(cq.id);
}

// ── Handler principal ────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).json({ ok: true });

  const secretHeader = req.headers['x-telegram-bot-api-secret-token'];
  if (secretHeader !== WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const update = req.body;

  if (update.callback_query) {
    await handleCallbackQuery(update.callback_query);
    return res.status(200).json({ ok: true });
  }

  const msg = update.message;
  if (!msg) return res.status(200).json({ ok: true });

  const chatId = msg.chat.id;
  const text = (msg.text || '').trim();
  const username = msg.from?.username || msg.from?.first_name || 'usuário';

  if (text.startsWith('/start')) {
    await handleStart(chatId, text, username);
    return res.status(200).json({ ok: true });
  }

  const userId = await getUserIdByChat(chatId);
  if (!userId) {
    await send(chatId, '🔗 Sua conta não está vinculada. Abra o SaiDaDívida e clique em "Conectar Telegram".');
    return res.status(200).json({ ok: true });
  }

  const mes = getMesAtual();

  if (text === '/ajuda' || text === '/help') {
    await send(chatId, `📋 <b>Comandos disponíveis:</b>\n\n💸 <b>Registrar gasto:</b>\n<code>gastei 50 no mercado</code>\n<code>paguei 150 de conta de luz</code>\n<code>mercado 54,90</code>\n\n📊 <b>Consultas:</b>\n/saldo — saldo do mês atual\n/contas — contas pendentes\n/ajuda — esta mensagem`);
    return res.status(200).json({ ok: true });
  }

  if (text === '/saldo') {
    await handleSaldo(chatId, userId, mes);
    return res.status(200).json({ ok: true });
  }

  if (text === '/contas') {
    await handleContas(chatId, userId, mes);
    return res.status(200).json({ ok: true });
  }

  await handleExpenseMessage(chatId, userId, mes, text);
  return res.status(200).json({ ok: true });
}
