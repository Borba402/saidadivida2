-- ============================================================
-- SaiDaDívida v2 — Schema de Compromissos
-- Execute no SQL Editor do Supabase
-- ============================================================

-- Tabela pai: compromisso mensal
CREATE TABLE IF NOT EXISTS compromissos (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  mes_referencia  TEXT NOT NULL,          -- Ex: 'Janeiro/2026'
  renda_mensal    DECIMAL(10,2) DEFAULT 0,
  dia_recebimento INTEGER,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, mes_referencia)
);

-- Tabela filho: itens de custo dentro do compromisso
CREATE TABLE IF NOT EXISTS itens_compromisso (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  compromisso_id  UUID REFERENCES compromissos(id) ON DELETE CASCADE NOT NULL,
  nome_item       TEXT NOT NULL,
  valor           DECIMAL(10,2) NOT NULL DEFAULT 0,
  data_vencimento DATE,                   -- NULL = sem vencimento
  pago            BOOLEAN DEFAULT FALSE,
  categoria       TEXT DEFAULT 'Outros',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: cada usuário só enxerga os próprios dados
ALTER TABLE compromissos     ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens_compromisso ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "compromissos_user" ON compromissos;
CREATE POLICY "compromissos_user" ON compromissos
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "itens_user" ON itens_compromisso;
CREATE POLICY "itens_user" ON itens_compromisso
  FOR ALL USING (
    compromisso_id IN (
      SELECT id FROM compromissos WHERE user_id = auth.uid()
    )
  );

-- Tabela de rendas extras por mês
CREATE TABLE IF NOT EXISTS rendas_extra (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  compromisso_id  UUID REFERENCES compromissos(id) ON DELETE CASCADE NOT NULL,
  descricao       TEXT NOT NULL,
  valor           DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE rendas_extra ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rendas_extra_user" ON rendas_extra;
CREATE POLICY "rendas_extra_user" ON rendas_extra
  FOR ALL USING (
    compromisso_id IN (
      SELECT id FROM compromissos WHERE user_id = auth.uid()
    )
  );

-- Tabela de tarefas diárias do usuário
CREATE TABLE IF NOT EXISTS tarefas (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  titulo          TEXT NOT NULL,
  anotacoes       TEXT,
  data_vencimento DATE,
  concluida       BOOLEAN DEFAULT FALSE,
  prioridade      TEXT DEFAULT 'normal',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tarefas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tarefas_user" ON tarefas;
CREATE POLICY "tarefas_user" ON tarefas
  FOR ALL USING (auth.uid() = user_id);

-- Tabela de avaliações da landing page (anônimas)
CREATE TABLE IF NOT EXISTS avaliacoes (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nota       INTEGER NOT NULL CHECK (nota BETWEEN 1 AND 5),
  comentario TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE avaliacoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "avaliacoes_insert" ON avaliacoes;
DROP POLICY IF EXISTS "avaliacoes_select" ON avaliacoes;
CREATE POLICY "avaliacoes_insert" ON avaliacoes FOR INSERT WITH CHECK (true);
CREATE POLICY "avaliacoes_select" ON avaliacoes FOR SELECT USING (true);
