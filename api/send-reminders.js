import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

webpush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL}`,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // Aceita chamada do cron ou POST manual
  const isCron = req.headers['x-vercel-cron'] === '1';
  const isPost = req.method === 'POST';
  if (!isCron && !isPost) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  const hoje    = new Date().toISOString().split('T')[0];
  const amanha  = new Date(Date.now() + 86_400_000).toISOString().split('T')[0];

  // Busca itens não pagos vencendo hoje ou amanhã
  const { data: itens, error } = await supabase
    .from('itens_compromisso')
    .select('nome_item, data_vencimento, compromisso:compromissos(user_id)')
    .in('data_vencimento', [hoje, amanha])
    .eq('pago', false);

  if (error) return res.status(500).json({ error: error.message });
  if (!itens?.length) return res.json({ sent: 0, message: 'Nenhum vencimento encontrado' });

  // Agrupa por usuário
  const porUsuario = {};
  for (const item of itens) {
    const uid = item.compromisso?.user_id;
    if (!uid) continue;
    if (!porUsuario[uid]) porUsuario[uid] = [];
    porUsuario[uid].push(item);
  }

  const userIds = Object.keys(porUsuario);
  if (!userIds.length) return res.json({ sent: 0 });

  // Busca inscrições push desses usuários
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('*')
    .in('user_id', userIds);

  let sent = 0;
  const promises = (subs || []).map(async (sub) => {
    const itensUsuario = porUsuario[sub.user_id] || [];
    const venceHoje   = itensUsuario.filter(i => i.data_vencimento === hoje);
    const venceAmanha = itensUsuario.filter(i => i.data_vencimento === amanha);

    let body = '';
    if (venceHoje.length)   body += `${venceHoje.length} conta(s) vence(m) HOJE! `;
    if (venceAmanha.length) body += `${venceAmanha.length} conta(s) vence(m) amanhã.`;

    try {
      await webpush.sendNotification(
        sub.subscription,
        JSON.stringify({
          title: '⚡ SaiDaDívida',
          body: body.trim(),
          url: '/'
        })
      );
      sent++;
    } catch (e) {
      if (e.statusCode === 410 || e.statusCode === 404) {
        // Inscrição expirada — remove do banco
        await supabase.from('push_subscriptions').delete().eq('id', sub.id);
      }
    }
  });

  await Promise.all(promises);
  return res.json({ sent, total: (subs || []).length });
}
