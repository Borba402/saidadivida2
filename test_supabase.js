import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Lê o arquivo .env manualmente para o teste
const envPath = path.resolve('.env');
const envFile = fs.readFileSync(envPath, 'utf8');

const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    env[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

console.log('Testando conexão com:');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey ? 'Preenchida (oculta)' : 'Faltando');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    // Fazemos uma chamada simples, como tentar ler uma tabela existente ou apenas fazer um select simples
    console.log('\nIniciando ping para o Supabase...');
    const { data, error } = await supabase.from('usuarios').select('*').limit(1);
    
    if (error) {
      // Se a tabela não existir, mas o erro for de banco de dados (ex: relation "usuarios" does not exist), 
      // significa que a conexão foi bem-sucedida!
      if (error.code === '42P01') {
         console.log('✅ Conexão bem-sucedida! A tabela "usuarios" ainda não existe no Supabase, mas a conexão com o banco funcionou.');
      } else {
         console.log('❌ Erro de conexão ou permissão:', error.message, error);
      }
    } else {
      console.log('✅ Conexão bem-sucedida! Tabela acessada sem erros.', data);
    }
  } catch (err) {
    console.log('❌ Falha catastrófica ao tentar conectar:', err.message);
  }
}

testConnection();
