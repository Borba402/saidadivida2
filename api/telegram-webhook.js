import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function getMesAtual() {
  const now = new Date();
  return `${MESES[now.getMonth()]}/${now.getFullYear()}`;
}

async function send(chatId, text) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  });
}

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

function parseExpense(text) {
  // "gastei 50 no mercado" / "paguei 1500 de aluguel" / "50 mercado"
  const patterns = [
    /(?:gastei|paguei|comprei|gasto|despesa)\s+r?\$?\s*(\d+(?:[.,]\d{1,2})?)\s+(?:no|na|de|com|em|p\/|para)?\s*(.+)/i,
    /r?\$?\s*(\d+(?:[.,]\d{1,2})?)\s+(?:no|na|de|com|em|p\/|para)?\s*(.+)/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      const valor = parseFloat(m[1].replace(',', '.'));
      const nome = m[2].trim().replace(/^(no |na |de |com |em )/, '').trim();
      if (valor > 0 && nome.length > 0) {
        return { valor, nome, categoria: detectCategory(nome) };
      }
    }
  }
  return null;
}

async function getOrCreateCompromisso(userId, mes) {
  const { data: existing } = await supabase
    .from('compromissos')
    .select('id')
    .eq('user_id', userId)
    .eq('mes_referencia', mes)
    .maybeSingle();
  if (existing) return existing.id;

  const { data: created } = await supabase
    .from('compromissos')
    .insert({ user_id: userId, mes_referencia: mes, renda_mensal: 0 })
    .select('id')
    .single();
  return created.id;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).json({ ok: true });

  const update = req.body;
  const msg = update.message;
  if (!msg) return res.status(200).json({ ok: true });

  const chatId = msg.chat.id;
  const text = (msg.text || '').trim();
  const username = msg.from?.username || msg.from?.first_name || 'usuário';

  // ── /start TOKEN ───────────────────────────────────────
  if (text.startsWith('/start')) {
    const token = text.split(' ')[1]?.toUpperCase();
    if (!token) {
      await send(chatId, '👋 Olá! Para conectar sua conta do <b>SaiDaDívida</b>, abra o app e clique em "Conectar Telegram" para obter seu código.');
      return res.status(200).json({ ok: true });
    }

    const { data: link } = await supabase
      .from('telegram_links')
      .select('user_id, token_expires_at')
      .eq('link_token', token)
      .maybeSingle();

    if (!link) {
      await send(chatId, '❌ Código inválido. Volte ao app e gere um novo código em "Conectar Telegram".');
      return res.status(200).json({ ok: true });
    }
    if (new Date(link.token_expires_at) < new Date()) {
      await send(chatId, '⏰ Código expirado. Volte ao app e gere um novo código.');
      return res.status(200).json({ ok: true });
    }

    await supabase.from('telegram_links').update({
      telegram_chat_id: String(chatId),
      telegram_username: username,
      link_token: null,
      token_expires_at: null,
      linked_at: new Date().toISOString(),
    }).eq('user_id', link.user_id);

    await send(chatId, `✅ Conta vinculada com sucesso! Olá, ${username}!\n\nAgora você pode registrar gastos enviando mensagens como:\n<code>gastei 50 no mercado</code>\n<code>paguei 1500 de aluguel</code>\n\nDigite /ajuda para ver todos os comandos.`);
    return res.status(200).json({ ok: true });
  }

  // Busca usuário vinculado
  const { data: link } = await supabase
    .from('telegram_links')
    .select('user_id')
    .eq('telegram_chat_id', String(chatId))
    .maybeSingle();

  if (!link) {
    await send(chatId, '🔗 Sua conta não está vinculada. Abra o SaiDaDívida e clique em "Conectar Telegram".');
    return res.status(200).json({ ok: true });
  }

  const userId = link.user_id;
  const mes = getMesAtual();

  // ── /ajuda ─────────────────────────────────────────────
  if (text === '/ajuda' || text === '/help') {
    await send(chatId, `📋 <b>Comandos disponíveis:</b>\n\n💸 <b>Registrar gasto:</b>\n<code>gastei 50 no mercado</code>\n<code>paguei 150 de conta de luz</code>\n<code>120 uber</code>\n\n📊 <b>Consultas:</b>\n/saldo — saldo do mês atual\n/contas — contas pendentes\n/ajuda — esta mensagem`);
    return res.status(200).json({ ok: true });
  }

  // ── /saldo ─────────────────────────────────────────────
  if (text === '/saldo') {
    const { data: comp } = await supabase
      .from('compromissos')
      .select('id, renda_mensal')
      .eq('user_id', userId)
      .eq('mes_referencia', mes)
      .maybeSingle();

    if (!comp) {
      await send(chatId, `📅 Nenhum dado encontrado para ${mes}.`);
      return res.status(200).json({ ok: true });
    }

    const { data: itens } = await supabase
      .from('itens_compromisso')
      .select('valor, pago')
      .eq('compromisso_id', comp.id);

    const total = (itens || []).reduce((s, i) => s + Number(i.valor), 0);
    const pago  = (itens || []).filter(i => i.pago).reduce((s, i) => s + Number(i.valor), 0);
    const saldo = Number(comp.renda_mensal) - total;
    const fmt = (v) => `R$ ${v.toFixed(2).replace('.', ',')}`;

    await send(chatId, `📊 <b>Saldo — ${mes}</b>\n\n💰 Renda: ${fmt(comp.renda_mensal)}\n🔴 Comprometido: ${fmt(total)}\n✅ Pago: ${fmt(pago)}\n🟡 Restante: ${fmt(total - pago)}\n\n💵 Saldo livre: ${fmt(saldo)}`);
    return res.status(200).json({ ok: true });
  }

  // ── /contas ────────────────────────────────────────────
  if (text === '/contas') {
    const { data: comp } = await supabase
      .from('compromissos')
      .select('id')
      .eq('user_id', userId)
      .eq('mes_referencia', mes)
      .maybeSingle();

    if (!comp) {
      await send(chatId, `📅 Nenhuma conta encontrada para ${mes}.`);
      return res.status(200).json({ ok: true });
    }

    const { data: itens } = await supabase
      .from('itens_compromisso')
      .select('nome_item, valor, pago, data_vencimento')
      .eq('compromisso_id', comp.id)
      .eq('pago', false)
      .order('data_vencimento', { ascending: true });

    if (!itens?.length) {
      await send(chatId, `🎉 Todas as contas de ${mes} já estão pagas!`);
      return res.status(200).json({ ok: true });
    }

    const fmt = (v) => `R$ ${Number(v).toFixed(2).replace('.', ',')}`;
    const linhas = itens.map(i => `• ${i.nome_item} — ${fmt(i.valor)}${i.data_vencimento ? ` (vence ${i.data_vencimento.split('-').reverse().join('/')})` : ''}`).join('\n');
    await send(chatId, `⚠️ <b>Contas pendentes — ${mes}:</b>\n\n${linhas}`);
    return res.status(200).json({ ok: true });
  }

  // ── Registrar gasto (texto livre) ─────────────────────
  const expense = parseExpense(text);
  if (expense) {
    const compId = await getOrCreateCompromisso(userId, mes);
    await supabase.from('itens_compromisso').insert({
      compromisso_id: compId,
      nome_item: expense.nome,
      valor: expense.valor,
      categoria: expense.categoria,
      pago: false,
    });

    const fmt = (v) => `R$ ${v.toFixed(2).replace('.', ',')}`;
    await send(chatId, `✅ <b>Registrado em ${mes}:</b>\n\n📝 ${expense.nome}\n💰 ${fmt(expense.valor)}\n🏷 ${expense.categoria}\n\nDigite /saldo para ver o resumo.`);
    return res.status(200).json({ ok: true });
  }

  // Mensagem não reconhecida
  await send(chatId, `❓ Não entendi. Tente:\n<code>gastei 50 no mercado</code>\n\nOu digite /ajuda para ver os comandos.`);
  res.status(200).json({ ok: true });
}
