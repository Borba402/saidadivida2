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

// mes_referencia é texto ('Julho/2026'), então não dá para comparar com > no SQL.
// Convertemos para um inteiro ordenável para filtrar meses futuros em JS.
function ordemDoMes(mesRef) {
  const { ano, mes } = parseMonthRef(mesRef);
  return ano * 12 + mes;
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

    // Ocorrências que o usuário excluiu neste mês não devem voltar.
    const { data: excecoes, error: excError } = await supabase
      .from('recurring_exceptions')
      .select('recurring_bill_id')
      .eq('mes_referencia', mesRef)
      .eq('tipo', 'excluida')
      .in('recurring_bill_id', models.map(m => m.id));

    if (excError) {
      // Falha fechada: sem saber o que foi excluído, materializar traria os itens
      // apagados de volta — exatamente o bug que esta tabela existe para evitar.
      console.warn('Não foi possível ler recurring_exceptions; materialização abortada:', excError);
      return;
    }

    const excluidos = new Set((excecoes || []).map(e => e.recurring_bill_id));
    const materializaveis = models.filter(m => !excluidos.has(m.id));
    if (materializaveis.length === 0) return;

    const { ano, mes } = parseMonthRef(mesRef);
    const toInsert = materializaveis.map(m => ({
      compromisso_id: compromissoId,
      recurring_bill_id: m.id,
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

  // Vincula o item que originou o modelo, senão ele ficaria sem recurring_bill_id
  // e não ofereceria as opções de exclusão de recorrente.
  const { error: linkError } = await supabase
    .from('itens_compromisso')
    .update({ recurring_bill_id: data.id })
    .eq('id', item.id);
  if (linkError) console.warn('Modelo criado, mas não consegui vincular o item:', linkError);

  return data;
}

/**
 * "Excluir só este mês": registra a exceção e apaga a instância.
 * A exceção vem ANTES do delete de propósito — se o delete falhar, sobra só uma
 * exceção inofensiva; na ordem inversa, o item voltaria no próximo carregamento.
 */
export async function excluirOcorrencia(item, mesRef) {
  const { error: excError } = await supabase.from('recurring_exceptions').upsert({
    recurring_bill_id: item.recurring_bill_id,
    mes_referencia: mesRef,
    tipo: 'excluida',
  }, { onConflict: 'recurring_bill_id,mes_referencia' });
  if (excError) throw excError;

  const { error: delError } = await supabase
    .from('itens_compromisso').delete().eq('id', item.id);
  if (delError) throw delError;
}

/**
 * "Excluir as próximas ocorrências": desativa o modelo e limpa o que já havia
 * sido materializado em meses futuros. Mês atual e passados ficam intactos.
 */
export async function excluirOcorrenciasFuturas(item, mesRef, userId) {
  const { error: upError } = await supabase.from('recurring_bills')
    .update({ active: false }).eq('id', item.recurring_bill_id);
  if (upError) throw upError;

  const { data: comps, error: compError } = await supabase
    .from('compromissos').select('id, mes_referencia').eq('user_id', userId);
  if (compError) throw compError;

  const limite = ordemDoMes(mesRef);
  const futuros = (comps || [])
    .filter(c => ordemDoMes(c.mes_referencia) > limite)
    .map(c => c.id);
  if (futuros.length === 0) return;

  const { error: delError } = await supabase
    .from('itens_compromisso').delete()
    .eq('recurring_bill_id', item.recurring_bill_id)
    .in('compromisso_id', futuros);
  if (delError) throw delError;
}

export async function stopRecurring(recurringId) {
  const { error } = await supabase.from('recurring_bills')
    .update({ active: false }).eq('id', recurringId);
  if (error) throw error;
}

export async function listRecurringBills(userId) {
  const { data } = await supabase
    .from('recurring_bills')
    .select('id, name')
    .eq('user_id', userId)
    .eq('active', true);
  return data || [];
}
