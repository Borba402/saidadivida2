import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || supabaseUrl.includes('<COLOQUE_SEU_PROJECT_ID_AQUI>')) {
  console.warn('Supabase URL não configurada corretamente. Verifique seu arquivo .env');
}

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseKey || '');
