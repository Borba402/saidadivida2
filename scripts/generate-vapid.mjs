import webpush from 'web-push';

const keys = webpush.generateVAPIDKeys();

console.log('\n✅ Chaves VAPID geradas com sucesso!\n');
console.log('Adicione estas variáveis no Vercel e no .env.local:\n');
console.log('VITE_VAPID_PUBLIC_KEY=' + keys.publicKey);
console.log('VAPID_PUBLIC_KEY='      + keys.publicKey);
console.log('VAPID_PRIVATE_KEY='     + keys.privateKey);
console.log('\nNo Vercel, adicione também:');
console.log('VAPID_EMAIL=seu@email.com');
console.log('SUPABASE_SERVICE_ROLE_KEY=<chave do Supabase>\n');
