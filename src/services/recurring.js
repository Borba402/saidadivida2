import { supabase } from './supabase';

const MESES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
];

function parseMonthRef(mesRef) {
  const [nomeMes, ano] = mesRef.split('/');
  return { ano: Number(ano), mes: MESES.indexOf(nomeMes) + 1 };
}

function lastDayOfMonth(ano, mes) {
  return new Date(ano, mes, 0).getDate();
}

function buildDueDate(ano, mes, dueDay) {
  const day = Math.min(dueDay, lastDayOfMonth(ano, mes));
  const mm = String(mes).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${ano}-${mm}-${dd}`;
}

export async function materializeRecurringForMonth(userId, mesRef, compromissoId) {
  try {
    // Busca modelos ativos do usuário
    const { data: models, error: fetchError } = await supabase
      .from('recurring_bills')
      .select('*')
      .eq('user_id', userId)
      .eq('active', true);
    
    if (fetchError) {
      console.warn('Tabela recurring_bills pode não existir ou erro de permissão:', fetchError);
      return;
    }
    if (!models || models.length === 0) return;

    const { ano, mes } = parseMonthRef(mesRef);
    const toInsert = models.map(m => ({
      compromisso_id: compromissoId,
      nome_item: m.name,
      valor: m.default_amount,
      categoria: m.category || 'Outros',
      data_vencimento: buildDueDate(ano, mes, m.due_day),
      pago: false,
    }));

    // upsert com ignoreDuplicates para idempotência
    const { error: insertError } = await supabase.from('itens_compromisso').upsert(toInsert, {
      onConflict: 'compromisso_id,nome_item',
      ignoreDuplicates: true,
    });

    if (insertError) {
      console.warn('Erro ao materializar contas recorrentes (verifique se a migração com índice único foi rodada):', insertError);
    }
  } catch (err) {
    console.error('Falha na materialização silenciosa de recorrentes:', err);
  }
}

export async function setBillRecurring(item, userId) {
  const [y, m, d] = (item.data_vencimento || '').split('-').map(Number);
  const dueDay = d || 1;
  const { data, error } = await supabase.from('recurring_bills').insert({
    user_id: userId,
    name: item.nome_item,
    category: item.categoria || 'Outros',
    default_amount: Number(item.valor),
    due_day: dueDay,
    active: true,
  }).select().single();
  
  if (error) throw error;
  return data;
}

export async function stopRecurring(recurringId) {
  const { error } = await supabase.from('recurring_bills')
    .update({ active: false }).eq('id', recurringId);
  if (error) throw error;
}
