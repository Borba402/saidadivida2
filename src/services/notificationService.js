import { supabase } from './supabase';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(b64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

export function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export async function getPermissionStatus() {
  if (!isPushSupported()) return 'unsupported';
  return Notification.permission; // 'granted' | 'denied' | 'default'
}

export async function isSubscribed() {
  if (!isPushSupported()) return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    return !!sub;
  } catch { return false; }
}

export async function subscribe(userId) {
  if (!isPushSupported()) throw new Error('Notificações não suportadas neste navegador');
  if (!VAPID_PUBLIC_KEY) throw new Error('Chave VAPID não configurada');

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Permissão negada pelo usuário');

  const reg = await navigator.serviceWorker.ready;
  const existing = await reg.pushManager.getSubscription();
  if (existing) await existing.unsubscribe();

  const subscription = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });

  const { error } = await supabase.from('push_subscriptions').upsert({
    user_id: userId,
    subscription: subscription.toJSON(),
  }, { onConflict: 'user_id' });

  if (error) throw error;
  return subscription;
}

export async function unsubscribe(userId) {
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) await sub.unsubscribe();
  } catch { /* ignore */ }

  await supabase.from('push_subscriptions').delete().eq('user_id', userId);
}
