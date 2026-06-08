import { supabase } from './supabase';

export async function createAvaliacao({ nota, comentario }) {
  const { data, error } = await supabase
    .from('avaliacoes')
    .insert({ nota, comentario: comentario || null })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getMediaAvaliacoes() {
  const { data, error } = await supabase
    .from('avaliacoes')
    .select('nota');
  if (error) throw error;
  if (!data || data.length === 0) return null;
  const total = data.length;
  const media = data.reduce((sum, r) => sum + r.nota, 0) / total;
  return { media, total };
}
