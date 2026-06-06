import { supabase } from './supabase';

const MESES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
];

export function getMesAtual() {
  const now = new Date();
  return `${MESES[now.getMonth()]}/${now.getFullYear()}`;
}

// Gera lista de meses: 3 anteriores + atual + 8 futuros
export function getMesesDisponiveis() {
  const now = new Date();
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 3 + i, 1);
    return `${MESES[d.getMonth()]}/${d.getFullYear()}`;
  });
}

// ── Compromissos ─────────────────────────────────────────────

export async function listCompromissos(userId) {
  const { data, error } = await supabase
    .from('compromissos')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getOrCreateCompromisso(userId, mesReferencia) {
  const { data: existing, error: fetchErr } = await supabase
    .from('compromissos')
    .select('*')
    .eq('user_id', userId)
    .eq('mes_referencia', mesReferencia)
    .maybeSingle();

  if (fetchErr) throw fetchErr;
  if (existing) return existing;

  const { data, error } = await supabase
    .from('compromissos')
    .insert({ user_id: userId, mes_referencia: mesReferencia, renda_mensal: 0 })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCompromisso(id, updates) {
  const { data, error } = await supabase
    .from('compromissos')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── Itens ─────────────────────────────────────────────────────

export async function listItens(compromissoId) {
  const { data, error } = await supabase
    .from('itens_compromisso')
    .select('*')
    .eq('compromisso_id', compromissoId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createItem(compromissoId, item) {
  const { data, error } = await supabase
    .from('itens_compromisso')
    .insert({
      compromisso_id: compromissoId,
      nome_item: item.nome_item,
      valor: Number(item.valor),
      data_vencimento: item.data_vencimento || null,
      pago: item.pago ?? false,
      categoria: item.categoria || 'Outros'
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateItem(id, updates) {
  const { data, error } = await supabase
    .from('itens_compromisso')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteItem(id) {
  const { error } = await supabase
    .from('itens_compromisso')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
}

export async function togglePago(id, pago) {
  return updateItem(id, { pago });
}

export const CATEGORIAS = [
  'Alimentação', 'Moradia', 'Transporte', 'Saúde',
  'Educação', 'Lazer', 'Vestuário', 'Serviços', 'Dívidas', 'Outros'
];
