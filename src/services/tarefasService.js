import { supabase } from './supabase';

export const PRIORIDADES = ['baixa', 'normal', 'alta'];

export async function listTarefas(userId) {
  const { data, error } = await supabase
    .from('tarefas')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createTarefa(userId, { titulo, anotacoes, data_vencimento, prioridade }) {
  const { data, error } = await supabase
    .from('tarefas')
    .insert({
      user_id: userId,
      titulo,
      anotacoes: anotacoes || null,
      data_vencimento: data_vencimento || null,
      prioridade: prioridade || 'normal',
      concluida: false,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTarefa(id, updates) {
  const { data, error } = await supabase
    .from('tarefas')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTarefa(id) {
  const { error } = await supabase.from('tarefas').delete().eq('id', id);
  if (error) throw error;
}

export async function toggleConcluida(id, concluida) {
  return updateTarefa(id, { concluida });
}
