import { supabase } from './supabase';

export async function getTelegramLink(userId) {
  const { data } = await supabase
    .from('telegram_links')
    .select('telegram_username, linked_at, telegram_chat_id')
    .eq('user_id', userId)
    .maybeSingle();
  // Vinculado de verdade só quando tem chat_id real (não 'pending')
  if (data?.telegram_chat_id && data.telegram_chat_id !== 'pending') return data;
  return null;
}

export async function generateLinkToken(userId) {
  const token = Math.random().toString(36).substring(2, 8).toUpperCase();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

  await supabase.from('telegram_links').upsert({
    user_id: userId,
    link_token: token,
    token_expires_at: expiresAt.toISOString(),
    telegram_chat_id: 'pending',
    telegram_username: null,
    linked_at: null,
  }, { onConflict: 'user_id' });

  return token;
}

export async function unlinkTelegram(userId) {
  await supabase.from('telegram_links').delete().eq('user_id', userId);
}
